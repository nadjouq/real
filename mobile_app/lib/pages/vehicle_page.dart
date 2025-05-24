import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'login_page.dart';

class Vehicle {
  final String code;
  final String matricule;
  final String marque;
  final String type;
  final String statut;
  final String structure;
  final String kmTotal;
  final String derniereMaj;

  Vehicle({
    required this.code,
    required this.matricule,
    required this.marque,
    required this.type,
    required this.statut,
    required this.structure,
    required this.kmTotal,
    required this.derniereMaj,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      code: json['code'] ?? '',
      matricule: json['matricule'] ?? '',
      marque: json['marque'] ?? '',
      type: json['type'] ?? '',
      statut: json['statut'] ?? '',
      structure: json['structure'] ?? '',
      kmTotal: json['kmTotal'] ?? '',
      derniereMaj: json['derniereMaj'] ?? '',
    );
  }
}

class VehiclePage extends StatefulWidget {
  const VehiclePage({super.key});

  @override
  State<VehiclePage> createState() => _VehiclePageState();
}

class _VehiclePageState extends State<VehiclePage> {
  List<Vehicle> vehicles = [];
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    fetchVehicles();
  }

  Future<void> fetchVehicles() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      print('Tentative de connexion au serveur...');
      print('URL: http://192.168.8.106:3000/api/mobile/vehicule');

      final response = await http.get(
        Uri.parse('http://192.168.8.106:3000/api/mobile/vehicule'),
        headers: {
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      print('Code de réponse: ${response.statusCode}');
      print('Headers de la réponse: ${response.headers}');
      print('Corps de la réponse: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        print('Données reçues: ${data.length} véhicules');
        if (data.isNotEmpty) {
          print('Premier véhicule: ${data[0]}');
        }

        setState(() {
          vehicles = data.map((json) => Vehicle.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        print('Erreur HTTP: ${response.statusCode}');
        print('Message d\'erreur: ${response.body}');
        setState(() {
          error = 'Erreur ${response.statusCode}: ${response.body}';
          isLoading = false;
        });
      }
    } catch (e) {
      print('Exception détaillée: $e');
      setState(() {
        error = 'Erreur de connexion au serveur: $e';
        isLoading = false;
      });
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'en service':
        return Colors.green;
      case 'en maintenance':
        return Colors.orange;
      case 'hors service':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          'Gestion des Véhicules',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF002866),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: fetchVehicles,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: fetchVehicles,
        child: isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF002866)),
                ),
              )
            : error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Colors.red,
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          error!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontSize: 16,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: fetchVehicles,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF002866),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  )
                : vehicles.isEmpty
                    ? const Center(
                        child: Text(
                          'Aucun véhicule trouvé',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey,
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: vehicles.length,
                        itemBuilder: (context, index) {
                          final vehicle = vehicles[index];
                          return Card(
                            elevation: 2,
                            margin: const EdgeInsets.only(bottom: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(12),
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Colors.white,
                                    Colors.blue.shade50,
                                  ],
                                ),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            vehicle.matricule,
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF002866),
                                            ),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 6,
                                          ),
                                          decoration: BoxDecoration(
                                            color:
                                                _getStatusColor(vehicle.statut)
                                                    .withOpacity(0.1),
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border: Border.all(
                                              color: _getStatusColor(
                                                  vehicle.statut),
                                            ),
                                          ),
                                          child: Text(
                                            vehicle.statut,
                                            style: TextStyle(
                                              color: _getStatusColor(
                                                  vehicle.statut),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    _buildInfoRow(
                                      Icons.directions_car,
                                      'Type',
                                      vehicle.type,
                                    ),
                                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      Icons.business,
                                      'Marque',
                                      vehicle.marque,
                                    ),
                                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      Icons.qr_code,
                                      'Code',
                                      vehicle.code,
                                    ),
                                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      Icons.location_city,
                                      'Structure',
                                      vehicle.structure,
                                    ),
                                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      Icons.speed,
                                      'Kilométrage',
                                      '${vehicle.kmTotal} km',
                                    ),
                                    const SizedBox(height: 8),
                                    _buildInfoRow(
                                      Icons.update,
                                      'Dernière mise à jour',
                                      vehicle.derniereMaj,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: const Color(0xFF002866),
        ),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
