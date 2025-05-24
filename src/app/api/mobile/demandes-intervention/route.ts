import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

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

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 401, headers: corsHeaders }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Récupérer toutes les demandes d'intervention
    const demandes = await prisma.demande_intervention.findMany({
      select: {
        id_demande_intervention: true,
        numero_demande: true,
        etat_demande: true,
        date_application: true,
        nature_panne: true,
        nature_travaux: true,
        degre_urgence: true,
        description: true,
        code_vehicule: true,
        vehicule: {
          select: {
            code_vehicule: true,
            n_immatriculation: true,
            FK_vehicule_REF_type: {
              select: {
                designation: true,
                FK_type_REF_marque: {
                  select: {
                    designation: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date_application: 'desc',
      },
    });

    // Transformer les données pour l'interface mobile
    const formattedDemandes = demandes.map(demande => ({
      id: demande.id_demande_intervention,
      numero_demande: demande.numero_demande,
      date_demande: demande.date_application,
      statut: demande.etat_demande,
      nature_panne: demande.nature_panne,
      nature_travaux: demande.nature_travaux,
      degre_urgence: demande.degre_urgence,
      description: demande.description,
      vehicule: demande.vehicule ? {
        code: demande.vehicule.code_vehicule,
        immatriculation: demande.vehicule.n_immatriculation,
        marque: demande.vehicule.FK_vehicule_REF_type.FK_type_REF_marque.designation,
        type: demande.vehicule.FK_vehicule_REF_type.designation,
      } : null,
    }));

    return NextResponse.json(formattedDemandes, { headers: corsHeaders });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des demandes' },
      { status: 500, headers: corsHeaders }
    );
  }
} 