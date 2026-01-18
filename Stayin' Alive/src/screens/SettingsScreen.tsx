import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const SettingsScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.emptyText}>No settings available</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#E8F4F8',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#8B6F9E',
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFF0F2',
    padding: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#D4B5E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F5D0E8',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#8B6F9E',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8D5E3',
    backgroundColor: '#FFF5F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#5A4A6A',
  },
  button: {
    backgroundColor: '#B19CD9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#8B6F9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFF0F2',
    borderWidth: 2,
    borderColor: '#D4B5E8',
  },
  secondaryButtonText: {
    color: '#8B6F9E',
    fontSize: 16,
    fontWeight: '600',
  },
  idDisplay: {
    fontSize: 16,
    color: '#B19CD9',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#B19CD9',
    fontStyle: 'italic',
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderColor: '#E8D5E3',
    backgroundColor: '#FFF5F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#5A4A6A',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#9B8FB8',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  warningTextSmall: {
    fontSize: 12,
    color: '#FF9A9E',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
