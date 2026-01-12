import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';

const SettingsScreen = () => {
  const { emergencyContact, setEmergencyContact, userEmail, setUserEmail, userName, setUserName, userId, friends, addFriend } = useAttendance();
  const [contactInput, setContactInput] = useState(emergencyContact || '');
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [nameInput, setNameInput] = useState(userName || '');
  const [friendNameInput, setFriendNameInput] = useState('');
  const [friendIdInput, setFriendIdInput] = useState('');

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
  };

  const handleSaveName = async () => {
      if (!nameInput.trim()) {
          Alert.alert('Error', 'Please enter a name');
          return;
      }
      await setUserName(nameInput.trim());
      Alert.alert('Success', 'Your name has been saved');
  };

  const handleAddFriend = async () => {
      if (!friendNameInput.trim()) {
          Alert.alert('Error', 'Please enter friend\'s name');
          return;
      }
      if (!friendIdInput.trim()) {
          Alert.alert('Error', 'Please enter friend\'s ID key');
          return;
      }
      // Format ID key to ensure it starts with #
      const formattedId = friendIdInput.trim().startsWith('#') ? friendIdInput.trim() : `#${friendIdInput.trim()}`;
      const success = await addFriend({ name: friendNameInput.trim(), idKey: formattedId });
      if (success) {
          setFriendNameInput('');
          setFriendIdInput('');
          Alert.alert('Success', 'Friend added');
      } else {
          Alert.alert('Error', 'Friend with this ID key already exists');
      }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Your Name</Text>
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

      <View style={styles.section}>
        <Text style={styles.label}>Add Friends</Text>
        <TextInput
          style={styles.input}
          value={friendNameInput}
          onChangeText={setFriendNameInput}
          placeholder="Friend's name"
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          value={friendIdInput}
          onChangeText={setFriendIdInput}
          placeholder="Friend's ID key (e.g., #1111)"
          autoCapitalize="none"
        />
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleAddFriend}>
          <Text style={styles.secondaryButtonText}>Add Friend</Text>
        </TouchableOpacity>
        
        <View style={styles.friendsList}>
          {friends.length > 0 ? (
            friends.map((friend, index) => (
              <Text key={index} style={styles.friendItem}>• {friend.name} ({friend.idKey})</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No friends added yet</Text>
          )}
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
});

export default SettingsScreen;
