import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI } from '../services/api';
import { socketService } from '../services/socket';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayColor: string;
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    user: {
      id: string;
      username: string;
    };
  }>;
}

interface Room {
  id: string;
  name: string;
  isGeneral: boolean;
  creatorId?: string;
  members?: Array<{ id: string; username: string; displayColor: string }>;
}

const EMOJIS = ['👍', '❤️', '😂', '😢'];

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [hasHistoryAccess, setHasHistoryAccess] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    loadRoomsAndJoinGeneral();
    
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleTypingUsers = (users: { userId: string; username: string }[]) => {
      setTypingUsers(users.filter((u) => u.userId !== user?.id));
    };

    const handleReactionAdded = ({ messageId, reaction }: { messageId: string; reaction: any }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
            : msg
        )
      );
    };

    const handleReactionRemoved = ({ messageId, reactionId }: { messageId: string; reactionId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: msg.reactions?.filter((r) => r.id !== reactionId) || [],
              }
            : msg
        )
      );
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typingUsers', handleTypingUsers);
    socket.on('reactionAdded', handleReactionAdded);
    socket.on('reactionRemoved', handleReactionRemoved);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typingUsers', handleTypingUsers);
      socket.off('reactionAdded', handleReactionAdded);
      socket.off('reactionRemoved', handleReactionRemoved);
      
      if (currentRoom) {
        socketService.leaveRoom(currentRoom.id);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentRoom) {
      loadMessages(currentRoom.id);
      socketService.joinRoom(currentRoom.id);

      return () => {
        socketService.leaveRoom(currentRoom.id);
      };
    }
  }, [currentRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomsAndJoinGeneral = async () => {
    try {
      await chatAPI.joinGeneralRoom();
      const response = await chatAPI.getRooms();
      setRooms(response.data);
      
      const generalRoom = response.data.find((r: Room) => r.isGeneral);
      if (generalRoom) {
        setCurrentRoom(generalRoom);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await chatAPI.getRoomMessages(roomId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentRoom) return;

    socketService.sendMessage(currentRoom.id, messageInput);
    setMessageInput('');
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!currentRoom || !user) return;

    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(currentRoom.id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping && currentRoom) {
      setIsTyping(false);
      socketService.sendTyping(currentRoom.id, false);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!currentRoom) return;

    const message = messages.find((m) => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      (r) => r.user.id === user?.id && r.emoji === emoji
    );

    if (existingReaction) {
      socketService.removeReaction(existingReaction.id, currentRoom.id, messageId);
    } else {
      socketService.addReaction(messageId, emoji, currentRoom.id);
    }
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} est en train d'écrire...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].username} et ${typingUsers[1].username} sont en train d'écrire...`;
    }
    return `${typingUsers.length} personnes sont en train d'écrire...`;
  };

  const handleOpenAddMembers = async () => {
    if (!currentRoom) return;
    try {
      const userAPI = await import('../services/api').then(m => m.userAPI);
      const response = await userAPI.getAllUsers();
      const currentMemberIds = currentRoom.members?.map(m => m.id) || [];
      const filtered = response.data.filter((u: any) => !currentMemberIds.includes(u.id));
      setAvailableUsers(filtered);
      setShowAddMembers(true);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      await chatAPI.addMembersToRoom(currentRoom.id, {
        memberIds: selectedUsers,
        hasHistoryAccess,
      });
      setShowAddMembers(false);
      setSelectedUsers([]);
      setHasHistoryAccess(true);
      alert('Membres ajoutés avec succès !');
      loadRoomsAndJoinGeneral();
    } catch (error: any) {
      console.error('Error adding members:', error);
      alert(error.response?.data?.message || 'Échec de l\'ajout des membres');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">
            Salons de discussion
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                currentRoom?.id === room.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
              onClick={() => setCurrentRoom(room)}
            >
              <div className="flex items-center gap-2 font-semibold">
                <span className="truncate">{room.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentRoom?.name || 'Sélectionnez un salon'}
          </h2>
          {currentRoom && !currentRoom.isGeneral && currentRoom.creatorId === user?.id && (
            <button
              onClick={handleOpenAddMembers}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajouter des membres
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.user.id === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span
                  className="font-bold text-sm"
                  style={{ color: message.user.displayColor }}
                >
                  {message.user.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <div
                className={`px-4 py-3 rounded-lg max-w-md border ${
                  message.user.id === user?.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-800 border-gray-200'
                }`}
              >
                <p className="break-words">{message.content}</p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 items-center px-1">
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(
                      message.reactions.reduce((acc: Record<string, number>, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="px-3 py-1 bg-white rounded-full border border-gray-200 hover:border-blue-400 transition-colors flex items-center gap-1 font-semibold text-sm"
                      >
                        <span>{emoji}</span>
                        <span className="text-blue-600">{count}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 bg-white rounded-full px-2 py-1 border border-gray-200">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji)}
                      className="text-lg hover:bg-gray-100 transition-colors p-1 rounded-full"
                      title={`Réagir avec ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="px-6 py-2 bg-gray-100 border-t border-gray-200">
            <p className="text-sm italic text-blue-600 font-medium">
              {getTypingText()}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-white border-t border-gray-200"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              placeholder="Écrivez un message..."
              className="flex-1 px-5 py-3 border-2 border-gray-300 rounded-full focus:border-blue-500 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>

      {showAddMembers && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddMembers(false)}
        >
          <div
            className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ajouter des membres à {currentRoom?.name}
            </h2>
            <form onSubmit={handleAddMembers} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sélectionner des utilisateurs
                </label>
                {availableUsers.length === 0 ? (
                  <p className="text-gray-500 italic">Tous les utilisateurs sont déjà dans ce salon.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {availableUsers.map((u) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span
                          style={{ color: u.displayColor }}
                          className="font-semibold text-lg"
                        >
                          {u.username}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200">
                  <input
                    type="checkbox"
                    checked={hasHistoryAccess}
                    onChange={(e) => setHasHistoryAccess(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium text-gray-700">
                    Autoriser les nouveaux membres à voir l'historique
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMembers(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={selectedUsers.length === 0}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
