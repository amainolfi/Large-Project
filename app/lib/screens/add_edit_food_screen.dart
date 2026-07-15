import 'package:flutter/material.dart';

import '../models/food_entry.dart';
import '../widgets/food_entry_form.dart';

/// Standalone edit screen, pushed as a route from the Dashboard's Edit links.
/// The add flow lives in AddFoodTab; this wrapper is edit-only.
class AddEditFoodScreen extends StatelessWidget {
  final FoodEntry existing;

  const AddEditFoodScreen({super.key, required this.existing});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit food')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: FoodEntryForm(
            existing: existing,
            onSaved: () => Navigator.of(context).pop(true),
          ),
        ),
      ),
    );
  }
}
