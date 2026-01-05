import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('joinRoom', { roomId });
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leaveRoom', { roomId });
    }
  }

  sendMessage(roomId: string, content: string) {
    if (this.socket) {
      this.socket.emit('sendMessage', { roomId, content });
    }
  }

  sendTyping(roomId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  addReaction(messageId: string, emoji: string, roomId: string) {
    if (this.socket) {
      this.socket.emit('addReaction', { messageId, emoji, roomId });
    }
  }

  removeReaction(reactionId: string, roomId: string, messageId: string) {
    if (this.socket) {
      this.socket.emit('removeReaction', { reactionId, roomId, messageId });
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  onUserStoppedTyping(callback: (data: { userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on('userStoppedTyping', callback);
    }
  }

  onTypingUsers(callback: (users: { userId: string; username: string }[]) => void) {
    if (this.socket) {
      this.socket.on('typingUsers', callback);
    }
  }

  onReactionAdded(callback: (data: { messageId: string; reaction: any }) => void) {
    if (this.socket) {
      this.socket.on('reactionAdded', callback);
    }
  }

  onReactionRemoved(callback: (data: { messageId: string; reactionId: string }) => void) {
    if (this.socket) {
      this.socket.on('reactionRemoved', callback);
    }
  }
}

export const socketService = new SocketService();
