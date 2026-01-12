import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; // We will define this later
import * as Notifications from 'expo-notifications';
import { checkInactivity } from '../utils/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { lastAttendance, markAttendance, emergencyContact } = useAttendance();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
      const status = await checkInactivity();
      if (status.inactive) {
          Alert.alert(
              "Warning",
              "You haven't signed in for 2 days! Your emergency contact will be notified."
          );
          // Here we would trigger the email sending logic
      }
  }

  const handleAttendance = async () => {
    await markAttendance();
    Alert.alert("Success", "Attendance marked for today!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance Tracker</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Last Checked In: {lastAttendance ? lastAttendance.toLocaleString() : 'Never'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleAttendance}>
        <Text style={styles.buttonText}>Check In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.secondaryButtonText}>Settings</Text>
      </TouchableOpacity>
      
      {!emergencyContact && (
           <Text style={styles.warningText}>Please set an emergency contact in Settings!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  statusContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
      color: 'red',
      marginTop: 20,
      textAlign: 'center'
  }
});

export default HomeScreen;
