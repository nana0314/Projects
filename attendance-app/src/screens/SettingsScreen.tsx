import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';

const SettingsScreen = () => {
  const { emergencyContact, setEmergencyContact, userEmail, setUserEmail, userName, setUserName, userId } = useAttendance();
  const [contactInput, setContactInput] = useState(emergencyContact || '');
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [nameInput, setNameInput] = useState(userName || '');

  useEffect(() => {
    if (userName) {
      setNameInput(userName);
    }
  }, [userName]);

  const handleSaveContact = async () => {
    if (!contactInput.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    const success = await setEmergencyContact(contactInput);
    if (success) {
      Alert.alert('Success', 'Emergency contact updated');
    } else {
      Alert.alert('Not Found', 'Email not found');
    }
  };

  const handleSaveEmail = async () => {
      if (!emailInput.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email address');
          return;
      }
      await setUserEmail(emailInput);
      Alert.alert('Success', 'Your email updated');
  };

  const handleSaveName = async () => {
      if (!nameInput.trim()) {
          Alert.alert('Error', 'Please enter a name');
          return;
      }
      const success = await setUserName(nameInput.trim());
      if (success) {
          Alert.alert('Success', 'Your name has been saved and cannot be changed');
      } else {
          Alert.alert('Cannot Change', 'Your name has already been set and cannot be modified');
      }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Your Name</Text>
        {userName ? (
          // Name already set - show as read-only
          <>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{userName}</Text>
            </View>
            <Text style={styles.infoText}>Your name is set and cannot be changed</Text>
          </>
        ) : (
          // Name not set - allow input
          <>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              autoCapitalize="words"
            />
            <TouchableOpacity style={styles.button} onPress={handleSaveName}>
              <Text style={styles.buttonText}>Save Name</Text>
            </TouchableOpacity>
            <Text style={styles.warningTextSmall}>⚠️ Once saved, your name cannot be changed</Text>
          </>
        )}
        {userId && (
          <Text style={styles.idDisplay}>Your ID Key: {userId}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Your Email</Text>
        <TextInput
          style={styles.input}
          value={emailInput}
          onChangeText={setEmailInput}
          placeholder="your.email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveEmail}>
          <Text style={styles.buttonText}>Save My Email</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Emergency Contact Email</Text>
        <TextInput
          style={styles.input}
          value={contactInput}
          onChangeText={setContactInput}
          placeholder="emergency@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSaveContact}>
          <Text style={styles.buttonText}>Save Emergency Contact</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  idDisplay: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  warningTextSmall: {
    fontSize: 12,
    color: '#ff9500',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
