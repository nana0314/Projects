import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { getFriendLastAttendance, hasCheckedInToday, Friend } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type FriendsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Friends'>;

const FriendsScreen = () => {
  const { friends, addFriend, updateFriendNickname, deleteFriend, emergencyContactUserId, setEmergencyContactByFriendId, unsetEmergencyContact } = useAttendance();
  const navigation = useNavigation<FriendsScreenNavigationProp>();
  const [friendIdInput, setFriendIdInput] = useState('');
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({});
  const [editingNickname, setEditingNickname] = useState<Record<string, string>>({});
  const [nicknameInputs, setNicknameInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load friend check-in statuses
    const loadFriendStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      for (const friend of friends) {
        const lastAttendance = await getFriendLastAttendance(friend.idKey);
        statuses[friend.idKey] = hasCheckedInToday(lastAttendance);
      }
      setFriendStatuses(statuses);
    };
    if (friends.length > 0) {
      loadFriendStatuses();
    }
    // Initialize nickname inputs
    const inputs: Record<string, string> = {};
    friends.forEach(friend => {
      inputs[friend.idKey] = friend.nickname || '';
    });
    setNicknameInputs(inputs);
  }, [friends]);

  const handleAddFriend = async () => {
    if (!friendIdInput.trim()) {
      Alert.alert('Error', 'Please enter friend\'s ID key');
      return;
    }
    // Format ID key to ensure it starts with #
    const formattedId = friendIdInput.trim().startsWith('#') ? friendIdInput.trim() : `#${friendIdInput.trim()}`;
    const result = await addFriend({ name: '', idKey: formattedId });
    if (result.success) {
      setFriendIdInput('');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleEditNickname = (friendIdKey: string) => {
    setEditingNickname(prev => ({ ...prev, [friendIdKey]: friendIdKey }));
  };

  const handleSaveNickname = async (friendIdKey: string) => {
    const nickname = nicknameInputs[friendIdKey] || '';
    const success = await updateFriendNickname(friendIdKey, nickname);
    if (success) {
      setEditingNickname(prev => {
        const newState = { ...prev };
        delete newState[friendIdKey];
        return newState;
      });
      Alert.alert('Success', 'Nickname updated');
    } else {
      Alert.alert('Error', 'Failed to update nickname');
    }
  };

  const handleCancelEdit = (friendIdKey: string) => {
    setEditingNickname(prev => {
      const newState = { ...prev };
      delete newState[friendIdKey];
      return newState;
    });
    // Reset to original nickname
    const friend = friends.find(f => f.idKey === friendIdKey);
    setNicknameInputs(prev => ({
      ...prev,
      [friendIdKey]: friend?.nickname || ''
    }));
  };

  const handleDeleteFriend = (friend: Friend) => {
    Alert.alert(
      'Delete Friend',
      `Are you sure you want to remove ${friend.nickname || friend.name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFriend(friend.idKey);
            if (success) {
              Alert.alert('Success', 'Friend removed');
            } else {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const handleToggleEmergencyContact = async (friend: Friend) => {
    const isEmergencyContact = emergencyContactUserId === friend.idKey;
    if (isEmergencyContact) {
      // Unset emergency contact
      const success = await unsetEmergencyContact();
      if (success) {
        Alert.alert('Success', `${friend.nickname || friend.name} is no longer your emergency contact`);
      } else {
        Alert.alert('Error', 'Failed to unset emergency contact');
      }
    } else {
      // Set as emergency contact
      const success = await setEmergencyContactByFriendId(friend.idKey);
      if (success) {
        Alert.alert('Success', `${friend.nickname || friend.name} is now your emergency contact`);
      } else {
        Alert.alert('Error', 'Failed to set emergency contact');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Friends</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Add Friend</Text>
        <TextInput
          style={styles.input}
          value={friendIdInput}
          onChangeText={setFriendIdInput}
          placeholder="Friend's ID key (e.g., #1111)"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleAddFriend}>
          <Text style={styles.buttonText}>Add Friend</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Friends List</Text>
        <View style={styles.friendsList}>
          {friends.length > 0 ? (
            friends.map((friend, index) => {
              const checkedInToday = friendStatuses[friend.idKey] || false;
              const isEditing = editingNickname[friend.idKey] !== undefined;
              const displayName = friend.nickname || friend.name;
              return (
                <View key={index} style={styles.friendItemContainer}>
                  <View style={styles.friendInfo}>
                    {isEditing ? (
                      <View style={styles.nicknameEditContainer}>
                        <TextInput
                          style={styles.nicknameInput}
                          value={nicknameInputs[friend.idKey] || ''}
                          onChangeText={(text) => setNicknameInputs(prev => ({ ...prev, [friend.idKey]: text }))}
                          placeholder={`Nickname for ${friend.name}`}
                          autoCapitalize="words"
                        />
                        <TouchableOpacity 
                          style={styles.saveButton} 
                          onPress={() => handleSaveNickname(friend.idKey)}
                        >
                          <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.cancelButton} 
                          onPress={() => handleCancelEdit(friend.idKey)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.friendNameContainer}>
                        <Text style={styles.friendItem}>
                          • {displayName} {friend.nickname && <Text style={styles.originalName}>({friend.name})</Text>} ({friend.idKey})
                        </Text>
                        <View style={styles.actionButtonsContainer}>
                          <TouchableOpacity 
                            style={styles.editButton} 
                            onPress={() => handleEditNickname(friend.idKey)}
                          >
                            <Text style={styles.editButtonText}>Edit Nickname</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={emergencyContactUserId === friend.idKey ? styles.emergencyContactButtonActive : styles.emergencyContactButton}
                            onPress={() => handleToggleEmergencyContact(friend)}
                          >
                            <Text style={styles.emergencyContactButtonText}>
                              {emergencyContactUserId === friend.idKey ? 'Unset Emergency' : 'Set Emergency'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.deleteButton} 
                            onPress={() => handleDeleteFriend(friend)}
                          >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                  {!isEditing && (
                    <View style={[
                      styles.statusButton,
                      checkedInToday ? styles.statusButtonGreen : styles.statusButtonGrey
                    ]}>
                      <Text style={styles.statusButtonText}>
                        {checkedInToday ? '✓' : '○'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No friends added yet</Text>
          )}
        </View>
        <Text style={styles.noteText}>
          Note: You will receive notifications when your emergency contact doesn't check in for 2 days.
        </Text>
      </View>
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
  friendsList: {
    marginTop: 15,
  },
  friendItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5D0E8',
  },
  friendInfo: {
    flex: 1,
  },
  friendItem: {
    fontSize: 16,
    color: '#5A4A6A',
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statusButtonGreen: {
    backgroundColor: '#A8E6CF',
  },
  statusButtonGrey: {
    backgroundColor: '#E8D5E3',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#B19CD9',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 12,
    color: '#9B8FB8',
    fontStyle: 'italic',
    marginTop: 15,
    textAlign: 'center',
  },
  friendNameContainer: {
    flex: 1,
  },
  originalName: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  emergencyLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F5D0E8',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    color: '#8B6F9E',
    fontWeight: '600',
  },
  emergencyContactButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#B19CD9',
    borderRadius: 8,
    marginLeft: 8,
  },
  emergencyContactButtonActive: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FF9A9E',
    borderRadius: 8,
    marginLeft: 8,
  },
  emergencyContactButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFB3BA',
    borderRadius: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  nicknameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8D5E3',
    backgroundColor: '#FFF5F6',
    padding: 8,
    borderRadius: 8,
    fontSize: 14,
    marginRight: 8,
    color: '#5A4A6A',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#A8E6CF',
    borderRadius: 8,
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E8D5E3',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#8B6F9E',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FriendsScreen;
