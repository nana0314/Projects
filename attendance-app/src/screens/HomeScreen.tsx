import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; // We will define this later
import * as Notifications from 'expo-notifications';
import { checkEmergencyContactInactivity } from '../utils/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { lastAttendance, markAttendance, emergencyContactUserId, userName, setUserName, userId } = useAttendance();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [nameInput, setNameInput] = useState(userName || '');

  useEffect(() => {
    checkStatus();
    if (lastAttendance) {
      const today = new Date();
      const lastCheckIn = new Date(lastAttendance);
      const isToday = (
        today.getFullYear() === lastCheckIn.getFullYear() &&
        today.getMonth() === lastCheckIn.getMonth() &&
        today.getDate() === lastCheckIn.getDate()
      );
      setCheckedInToday(isToday);
    }
  }, [lastAttendance]);

  useEffect(() => {
    if (userName) {
      setNameInput(userName);
    }
  }, [userName]);

  const checkStatus = async () => {
      const status = await checkEmergencyContactInactivity();
      if (status.inactive && status.contactName) {
          Alert.alert(
              "Emergency Contact Alert",
              `${status.contactName} hasn't checked in for ${status.days} days!`
          );
      }
  }

  const handleAttendance = async () => {
    await markAttendance();
    setCheckedInToday(true);
    Alert.alert("Success", "Attendance marked for today!");
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
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
    <View style={styles.container}>
      {userName ? (
        <View style={styles.nameHeaderContainer}>
          <Text style={styles.nameDisplay}>{userName}</Text>
          {userId && (
            <Text style={styles.idDisplay}>{userId}</Text>
          )}
        </View>
      ) : (
        <View style={styles.nameSection}>
          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Enter your name"
            autoCapitalize="words"
          />
          <TouchableOpacity style={styles.nameButton} onPress={handleSaveName}>
            <Text style={styles.nameButtonText}>Save Name</Text>
          </TouchableOpacity>
          <Text style={styles.nameWarningText}>⚠️ Once saved, your name cannot be changed</Text>
        </View>
      )}
      
      <View style={styles.checkInContainer}>
        <TouchableOpacity 
          style={[
            styles.checkInButton,
            checkedInToday && styles.checkInButtonGreen
          ]} 
          onPress={handleAttendance}
        >
          <Text style={styles.checkInEmoji}>🤍</Text>
        </TouchableOpacity>
        
        {lastAttendance && (
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>
              {formatDate(lastAttendance)}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(lastAttendance)}
            </Text>
          </View>
        )}
        
        {!lastAttendance && (
          <Text style={styles.noCheckInText}>No check-in yet</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.secondaryButtonText}>Friends</Text>
      </TouchableOpacity>

      {!emergencyContactUserId && (
           <Text style={styles.warningText}>Please set an emergency contact from your Friends list!</Text>
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
    backgroundColor: '#E8F4F8',
  },
  nameHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'center',
  },
  nameDisplay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5A7A9A',
    marginRight: 10,
  },
  idDisplay: {
    fontSize: 20,
    color: '#9BB5C8',
    fontWeight: '500',
  },
  nameSection: {
    width: '100%',
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
  nameInput: {
    borderWidth: 1,
    borderColor: '#E8D5E3',
    backgroundColor: '#FFF5F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#5A4A6A',
  },
  nameButton: {
    backgroundColor: '#B19CD9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#8B6F9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10,
  },
  nameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nameWarningText: {
    fontSize: 12,
    color: '#FF9A9E',
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  checkInContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  checkInButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E8D5E3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8B6F9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 20,
  },
  checkInButtonGreen: {
    backgroundColor: '#A8E6CF',
  },
  checkInEmoji: {
    fontSize: 25,
    color: '#9B8FB8',
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5D0E8',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B6F9E',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 18,
    color: '#B19CD9',
  },
  noCheckInText: {
    fontSize: 16,
    color: '#C4A8D9',
    fontStyle: 'italic',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#B19CD9',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#8B6F9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4B5E8',
  },
  secondaryButtonText: {
    color: '#8B6F9E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
      color: '#FF9A9E',
      marginTop: 20,
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '500',
  }
});

export default HomeScreen;
