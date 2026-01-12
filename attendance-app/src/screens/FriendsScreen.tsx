import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAttendance } from '../context/AttendanceContext';
import { getFriendLastAttendance, hasCheckedInToday } from '../utils/storage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type FriendsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Friends'>;

const FriendsScreen = () => {
  const { friends, addFriend, updateFriendNickname } = useAttendance();
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
                        <TouchableOpacity 
                          style={styles.editButton} 
                          onPress={() => handleEditNickname(friend.idKey)}
                        >
                          <Text style={styles.editButtonText}>Edit Nickname</Text>
                        </TouchableOpacity>
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
          Note: Only emergency contact emails receive notifications when someone doesn't check in for 2 days.
        </Text>
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
  friendsList: {
    marginTop: 15,
  },
  friendItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendInfo: {
    flex: 1,
  },
  friendItem: {
    fontSize: 16,
    color: '#444',
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
    backgroundColor: '#34C759',
  },
  statusButtonGrey: {
    backgroundColor: '#C7C7CC',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 12,
    color: '#666',
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
  editButton: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  nicknameEditContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    fontSize: 14,
    marginRight: 8,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#34C759',
    borderRadius: 6,
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
    backgroundColor: '#C7C7CC',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default FriendsScreen;
