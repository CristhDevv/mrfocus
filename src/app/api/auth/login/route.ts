import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { verifyPassword, generateToken, AuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña requeridos' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Special bootstrap check for Camilo Superadmin
    if (cleanEmail === 'camilovelascoofficial@gmail.com' && password === 'Soloc@li1') {
      const superadminUser: AuthUser = {
        id: 'usr_camilo_superadmin',
        email: 'camilovelascoofficial@gmail.com',
        name: 'Camilo Velasco',
        role: 'superadmin',
      };
      const token = generateToken(superadminUser);
      const response = NextResponse.json({
        success: true,
        user: superadminUser,
        token,
        message: 'Bienvenido Superadmin Camilo',
      });
      response.cookies.set('mrfocus_token', token, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }

    // 1. Try local DB
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as {
      id: string;
      email: string;
      password_hash: string;
      name: string;
      role?: string;
    } | undefined;

    // 2. If not found in local DB, check Supabase
    if (!user) {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .single();
        if (data) {
          user = data;
          db.prepare(
            'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(data.id, data.email, data.password_hash, data.name, data.role || 'user', data.created_at, data.updated_at);
        }
      } catch {}
    }

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas. Revisa tu correo y contraseña.' }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas. Revisa tu correo y contraseña.' }, { status: 401 });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || (user.email === 'camilovelascoofficial@gmail.com' ? 'superadmin' : 'user'),
    };
    const token = generateToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
      message: 'Inicio de sesión exitoso',
    });

    response.cookies.set('mrfocus_token', token, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
