import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, chatAPI } from '../services/api';
import { Chat } from '../components/Chat';

export const ChatPage: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [displayColor, setDisplayColor] = useState(user?.displayColor || '#3B82F6');
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [hasHistoryAccess, setHasHistoryAccess] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userAPI.updateProfile({ username, displayColor });
      updateUser(response.data);
      setShowSettings(false);
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Échec de la mise à jour du profil');
    }
  };

  const handleOpenCreateRoom = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setAvailableUsers(response.data.filter((u: any) => u.id !== user?.id));
      setShowCreateRoom(true);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      alert('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      await chatAPI.createRoom({
        name: roomName,
        memberIds: selectedUsers,
        hasHistoryAccess,
      });
      setShowCreateRoom(false);
      setRoomName('');
      setSelectedUsers([]);
      setHasHistoryAccess(true);
      alert('Salon créé avec succès ! Rafraîchissez la page pour voir le nouveau salon.');
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Échec de la création du salon');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-full px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Nest Chat Websocket
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleOpenCreateRoom}
              className="px-5 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Créer un salon
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-5 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Paramètres
            </button>
            <button
              onClick={logout}
              className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <Chat />

      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Paramètres du profil
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur d'affichage
                </label>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="color"
                    value={displayColor}
                    onChange={(e) => setDisplayColor(e.target.value)}
                    className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                  />
                  <span
                    style={{ color: displayColor }}
                    className="text-2xl font-bold"
                  >
                    {username || 'Aperçu'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateRoom && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateRoom(false)}
        >
          <div
            className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Créer un salon de discussion
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du salon
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  placeholder="Entrez le nom du salon..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sélectionner des utilisateurs
                </label>
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
                    Autoriser les membres à voir l'historique des messages
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
