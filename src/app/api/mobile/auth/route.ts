import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

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

// Clé secrète pour JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    console.log('Tentative de connexion mobile pour:', username);

    const user = await prisma.utilisateur.findFirst({
      where: {
        username: username,
      },
      select: {
        id_utilisateur: true,
        nom_utilisateur: true,
        prenom_utilisateur: true,
        email: true,
        role: true,
        droit_utilisateur: true,
        code_structure: true,
        est_admin: true,
        username: true,
        numero_telephone: true,
        methode_authent: true,
        mot_de_passe: true
      }
    });

    if (!user) {
      console.log('Utilisateur mobile non trouvé');
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401, headers: corsHeaders }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.mot_de_passe);

    if (!isValidPassword) {
      console.log('Mot de passe mobile incorrect');
      return NextResponse.json(
        { error: 'Nom d\'utilisateur ou mot de passe incorrect' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Créer le token JWT pour mobile
    const token = jwt.sign(
      {
        id: user.id_utilisateur,
        username: user.username,
        role: user.role,
        type: 'mobile' // Ajouter un type pour différencier les tokens mobile
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Connexion mobile réussie pour:', username);

    // Retourner le token et les informations de l'utilisateur
    return NextResponse.json(
      {
        success: true,
        token: token,
        user: {
          id: user.id_utilisateur,
          nom: user.nom_utilisateur,
          prenom: user.prenom_utilisateur,
          email: user.email,
          role: user.role,
          droits: user.droit_utilisateur,
          structure: user.code_structure,
          username: user.username,
          telephone: user.numero_telephone,
          methodeAuth: user.methode_authent,
          estAdmin: user.est_admin
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Erreur lors de l\'authentification mobile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'authentification' },
      { status: 500, headers: corsHeaders }
    );
  }
} 