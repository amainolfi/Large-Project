import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';

/// Full Profile screen (screenshots 8-9): edit name, change password,
/// sign out, and delete account with a typed "DELETE" confirmation.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();

  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();

  final _deleteConfirm = TextEditingController();

  bool _prefilled = false;
  bool _savingProfile = false;
  bool _changingPassword = false;
  bool _deleting = false;

  @override
  void dispose() {
    for (final c in [
      _firstName, _lastName, _currentPassword, _newPassword,
      _confirmPassword, _deleteConfirm
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _prefillIfNeeded(AuthProvider auth) {
    if (_prefilled || auth.user == null) return;
    _firstName.text = auth.user!.firstName;
    _lastName.text = auth.user!.lastName;
    _prefilled = true;
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _saveProfile() async {
    if (_firstName.text.trim().isEmpty || _lastName.text.trim().isEmpty) {
      _toast('First and last name are required.');
      return;
    }
    setState(() => _savingProfile = true);
    final ok = await context.read<AuthProvider>().updateProfile(
          firstName: _firstName.text.trim(),
          lastName: _lastName.text.trim(),
        );
    if (!mounted) return;
    setState(() => _savingProfile = false);
    _toast(ok ? 'Profile updated' : 'Could not update profile');
  }

  Future<void> _changePassword() async {
    if (_newPassword.text != _confirmPassword.text) {
      _toast('New passwords do not match.');
      return;
    }
    setState(() => _changingPassword = true);
    final error = await context.read<AuthProvider>().changePassword(
          currentPassword: _currentPassword.text,
          newPassword: _newPassword.text,
        );
    if (!mounted) return;
    setState(() => _changingPassword = false);
    if (error == null) {
      _currentPassword.clear();
      _newPassword.clear();
      _confirmPassword.clear();
      _toast('Password changed');
    } else {
      _toast(error);
    }
  }

  Future<void> _deleteAccount() async {
    if (_deleteConfirm.text.trim() != 'DELETE') {
      _toast('Type DELETE to confirm.');
      return;
    }
    // Final confirmation dialog before the irreversible action.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete account?'),
        content: const Text(
            'This permanently removes your account, food log, and goals. '
            'This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFFF453A)),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _deleting = true);
    final ok = await context.read<AuthProvider>().deleteAccount();
    // On success the auth state flips to unauthenticated and the app routes
    // back to login automatically — no navigation needed here.
    if (!mounted) return;
    if (!ok) {
      setState(() => _deleting = false);
      _toast('Could not delete account');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    _prefillIfNeeded(auth);
    final user = auth.user;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Profile',
                style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            if (user != null)
              Text(user.email,
                  style: TextStyle(color: Colors.white.withOpacity(0.55))),
            const SizedBox(height: 24),

            // ---- Your details ----
            _card([
              const Text('Your details',
                  style:
                      TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              _label('First name'),
              _text(_firstName),
              const SizedBox(height: 16),
              _label('Last name'),
              _text(_lastName),
              const SizedBox(height: 20),
              _button('Save changes', _savingProfile, _saveProfile),
            ]),
            const SizedBox(height: 16),

            // ---- Change password ----
            _card([
              const Text('Change password',
                  style:
                      TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              _label('Current password'),
              _text(_currentPassword, obscure: true),
              const SizedBox(height: 16),
              _label('New password'),
              _text(_newPassword, obscure: true),
              const SizedBox(height: 6),
              Text(
                'At least 8 characters with uppercase, lowercase, a number, '
                'and a special character.',
                style: TextStyle(
                    fontSize: 13, color: Colors.white.withOpacity(0.55)),
              ),
              const SizedBox(height: 16),
              _label('Confirm new password'),
              _text(_confirmPassword, obscure: true),
              const SizedBox(height: 20),
              _button('Change password', _changingPassword, _changePassword),
            ]),
            const SizedBox(height: 16),

            // ---- Sign out ----
            _card([
              const Text('Sign out',
                  style:
                      TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.read<AuthProvider>().logout(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF34C759),
                    minimumSize: const Size.fromHeight(52),
                  ),
                  child: const Text('Sign out'),
                ),
              ),
            ]),
            const SizedBox(height: 16),

            // ---- Delete account ----
            _card([
              const Text('Delete account',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFF453A))),
              const SizedBox(height: 8),
              Text(
                'This permanently removes your account, food log, and goals. '
                'This cannot be undone.',
                style: TextStyle(color: Colors.white.withOpacity(0.55)),
              ),
              const SizedBox(height: 12),
              _label('Type "DELETE" to confirm'),
              _text(_deleteConfirm),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _deleting ? null : _deleteAccount,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFFF453A),
                    side: const BorderSide(color: Color(0xFFFF453A)),
                    minimumSize: const Size.fromHeight(52),
                  ),
                  child: _deleting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Delete my account'),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _card(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text,
            style:
                const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
      );

  Widget _text(TextEditingController c, {bool obscure = false}) {
    return TextField(
      controller: c,
      obscureText: obscure,
      decoration: const InputDecoration(border: OutlineInputBorder()),
    );
  }

  Widget _button(String label, bool busy, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: busy ? null : onPressed,
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        child: busy
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Text(label),
      ),
    );
  }
}
