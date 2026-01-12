import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';

const SettingsScreen = () => {
  const { emergencyContact, setEmergencyContact, userEmail, setUserEmail } = useAttendance();
  const [contactInput, setContactInput] = useState(emergencyContact || '');
  const [emailInput, setEmailInput] = useState(userEmail || '');
  // Mock friends list
  const [friendInput, setFriendInput] = useState('');
  const [friends, setFriends] = useState<string[]>([]);

  const handleSaveContact = async () => {
    if (!contactInput.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    await setEmergencyContact(contactInput);
    Alert.alert('Success', 'Emergency contact updated');
  };

  const handleSaveEmail = async () => {
      if (!emailInput.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email address');
          return;
      }
      await setUserEmail(emailInput);
      Alert.alert('Success', 'Your email updated');
  }

  const addFriend = () => {
    if (friendInput.trim()) {
      setFriends([...friends, friendInput]);
      setFriendInput('');
      Alert.alert('Success', 'Friend added (Mock)');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

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

      <View style={styles.section}>
        <Text style={styles.label}>Add Friends</Text>
        <TextInput
          style={styles.input}
          value={friendInput}
          onChangeText={setFriendInput}
          placeholder="Friend's name or email"
        />
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={addFriend}>
          <Text style={styles.secondaryButtonText}>Add Friend</Text>
        </TouchableOpacity>
        
        <View style={styles.friendsList}>
          {friends.map((friend, index) => (
            <Text key={index} style={styles.friendItem}>• {friend}</Text>
          ))}
        </View>
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
  friendsList: {
    marginTop: 15,
  },
  friendItem: {
    fontSize: 16,
    color: '#444',
    paddingVertical: 4,
  },
});

export default SettingsScreen;
