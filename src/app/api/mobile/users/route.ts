import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/app/api/mobile/auth/utils';

const prisma = new PrismaClient();

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    // Vérifier le token d'authentification
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    // Récupérer tous les utilisateurs
    const users = await prisma.utilisateur.findMany({
      select: {
        id_utilisateur: true,
        prenom_utilisateur: true,
        nom_utilisateur: true,
        email: true,
        role: true,
        numero_telephone: true,
        code_structure: true,
      },
    });

    // Transformer les données pour correspondre à l'interface mobile
    const formattedUsers = users.map(user => ({
      id: user.id_utilisateur,
      prenom: user.prenom_utilisateur,
      nom: user.nom_utilisateur,
      email: user.email,
      role: user.role,
      telephone: user.numero_telephone,
      structure: user.code_structure,
    }));

    return NextResponse.json(formattedUsers, { headers: corsHeaders });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 