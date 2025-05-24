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

    // Récupérer tous les rapports d'intervention
    const rapports = await prisma.rapport_intervention.findMany({
      select: {
        id_rapport_intervention: true,
        date_application: true,
        date_debut_travaux: true,
        date_fin_travaux: true,
        duree_travaux: true,
        description_essais: true,
        cout_total_traveaux_interne: true,
        cout_total_traveaux_externe: true,
        demande_intervention: {
          select: {
            numero_demande: true,
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
        },
      },
      orderBy: {
        date_application: 'desc',
      },
    });

    // Transformer les données pour l'interface mobile
    const formattedRapports = rapports.map(rapport => ({
      id: rapport.id_rapport_intervention,
      numero_rapport: rapport.demande_intervention?.numero_demande,
      date_rapport: rapport.date_application,
      date_debut: rapport.date_debut_travaux,
      date_fin: rapport.date_fin_travaux,
      duree: rapport.duree_travaux,
      description: rapport.description_essais,
      cout_interne: rapport.cout_total_traveaux_interne,
      cout_externe: rapport.cout_total_traveaux_externe,
      vehicule: rapport.demande_intervention?.vehicule ? {
        code: rapport.demande_intervention.vehicule.code_vehicule,
        immatriculation: rapport.demande_intervention.vehicule.n_immatriculation,
        marque: rapport.demande_intervention.vehicule.FK_vehicule_REF_type.FK_type_REF_marque.designation,
        type: rapport.demande_intervention.vehicule.FK_vehicule_REF_type.designation,
      } : null,
    }));

    return NextResponse.json(formattedRapports, { headers: corsHeaders });
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rapports' },
      { status: 500, headers: corsHeaders }
    );
  }
} 