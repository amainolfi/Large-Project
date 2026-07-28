import 'package:flutter/material.dart';

import 'add_food_tab.dart';
import 'dashboard_screen.dart';
import 'macros_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'wellness_screen.dart';

const homeNavigationLabels = [
  'Dashboard',
  'Add Food',
  'Macros',
  'History',
  'Wellness',
  'Profile',
];

/// The app shell after login: a bottom tab bar matching the mockups
/// (Dashboard / Add Food / Macros / History / Wellness / Profile). All tabs are
/// real screens.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  late final List<Widget> _tabs = const [
    DashboardScreen(),
    AddFoodTab(),
    MacrosScreen(),
    HistoryScreen(),
    WellnessScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: homeNavigationLabels[0]),
          NavigationDestination(
              icon: const Icon(Icons.add_circle_outline),
              selectedIcon: const Icon(Icons.add_circle),
              label: homeNavigationLabels[1]),
          NavigationDestination(
              icon: const Icon(Icons.tune_outlined),
              selectedIcon: const Icon(Icons.tune),
              label: homeNavigationLabels[2]),
          NavigationDestination(
              icon: const Icon(Icons.bar_chart_outlined),
              selectedIcon: const Icon(Icons.bar_chart),
              label: homeNavigationLabels[3]),
          NavigationDestination(
              icon: const Icon(Icons.favorite_border),
              selectedIcon: const Icon(Icons.favorite),
              label: homeNavigationLabels[4]),
          NavigationDestination(
              icon: const Icon(Icons.person_outline),
              selectedIcon: const Icon(Icons.person),
              label: homeNavigationLabels[5]),
        ],
      ),
    );
  }
}
