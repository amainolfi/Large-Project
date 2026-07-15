import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';

/// Temporary landing screen after login. Confirms the session works and gives
/// you a logout button. Replace with the real Dashboard next.
class HomePlaceholder extends StatelessWidget {
  const HomePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('MacroVanta'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => context.read<AuthProvider>().logout(),
          ),
        ],
      ),
      body: Center(
        child: Text(
          user == null
              ? 'Logged in.'
              : 'Logged in as ${user.fullName}\n${user.email}',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
