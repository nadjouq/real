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
