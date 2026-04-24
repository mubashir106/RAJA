const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

const rooms = new Map();

const SPAWN_POINTS = [
  { x: -18, y: 2, z: 0 },
  { x: 18, y: 2, z: 0 },
  { x: 0, y: 2, z: -18 },
  { x: 0, y: 2, z: 18 },
  { x: -14, y: 2, z: -14 },
  { x: 14, y: 2, z: 14 },
  { x: -14, y: 2, z: 14 },
  { x: 14, y: 2, z: -14 },
  { x: -22, y: 4, z: -22 },
  { x: 22, y: 4, z: 22 },
];

function randomSpawn() {
  return { ...SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)] };
}

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function buildPlayer(socketId, username) {
  return {
    id: socketId,
    username: (username || 'Operator').substring(0, 16),
    position: randomSpawn(),
    rotation: { x: 0, y: 0 },
    health: 100,
    kills: 0,
    deaths: 0,
    weapon: 'KN-44',
    state: 'idle',
    isAlive: true,
    color: Math.floor(Math.random() * 0xffffff),
  };
}

io.on('connection', (socket) => {
  let playerRoom = null;

  socket.on('create_room', (data, cb) => {
    const code = genCode();
    const player = buildPlayer(socket.id, data.username);
    rooms.set(code, { id: code, players: new Map([[socket.id, player]]), host: socket.id });
    socket.join(code);
    playerRoom = code;
    cb({ success: true, code, player, players: [] });
  });

  socket.on('join_room', (data, cb) => {
    const room = rooms.get(data.code);
    if (!room) return cb({ success: false, error: 'Room not found' });
    if (room.players.size >= 12) return cb({ success: false, error: 'Room is full' });

    const player = buildPlayer(socket.id, data.username);
    room.players.set(socket.id, player);
    socket.join(data.code);
    playerRoom = data.code;

    socket.to(data.code).emit('player_joined', player);
    const others = Array.from(room.players.values()).filter(p => p.id !== socket.id);
    cb({ success: true, code: data.code, player, players: others });
  });

  socket.on('player_update', (data) => {
    if (!playerRoom) return;
    const room = rooms.get(playerRoom);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    player.position = data.position;
    player.rotation = data.rotation;
    player.weapon = data.weapon;
    player.state = data.state;

    socket.to(playerRoom).emit('player_update', {
      id: socket.id,
      position: data.position,
      rotation: data.rotation,
      weapon: data.weapon,
      state: data.state,
    });
  });

  socket.on('player_shoot', (data) => {
    if (!playerRoom) return;
    socket.to(playerRoom).emit('player_shoot', { id: socket.id, origin: data.origin, direction: data.direction, weapon: data.weapon });
  });

  socket.on('player_hit', (data) => {
    if (!playerRoom) return;
    const room = rooms.get(playerRoom);
    if (!room) return;

    const target = room.players.get(data.targetId);
    if (!target || !target.isAlive) return;

    target.health = Math.max(0, target.health - data.damage);

    if (target.health <= 0) {
      target.isAlive = false;
      target.deaths++;
      const shooter = room.players.get(socket.id);
      if (shooter) shooter.kills++;

      const killEvent = {
        killerId: socket.id,
        killerName: shooter ? shooter.username : 'Unknown',
        victimId: data.targetId,
        victimName: target.username,
      };
      io.to(playerRoom).emit('player_killed', killEvent);
      io.to(data.targetId).emit('you_died', killEvent);

      // Broadcast updated scores
      io.to(playerRoom).emit('score_update', Array.from(room.players.values()).map(p => ({
        id: p.id, username: p.username, kills: p.kills, deaths: p.deaths
      })));

      setTimeout(() => {
        if (!room.players.has(data.targetId)) return;
        const t = room.players.get(data.targetId);
        t.health = 100;
        t.isAlive = true;
        const sp = randomSpawn();
        t.position = sp;
        io.to(data.targetId).emit('respawn', { position: sp });
      }, 3500);
    } else {
      io.to(data.targetId).emit('take_damage', { damage: data.damage, health: target.health, shooterId: socket.id });
    }

    socket.emit('hit_confirmed', { targetId: data.targetId, damage: data.damage, killed: target.health <= 0 });
  });

  socket.on('chat_message', (data) => {
    if (!playerRoom) return;
    const room = rooms.get(playerRoom);
    if (!room) return;
    const player = room.players.get(socket.id);
    io.to(playerRoom).emit('chat_message', {
      username: player ? player.username : 'Unknown',
      message: String(data.message).substring(0, 150),
    });
  });

  socket.on('disconnect', () => {
    if (!playerRoom) return;
    const room = rooms.get(playerRoom);
    if (!room) return;
    room.players.delete(socket.id);
    io.to(playerRoom).emit('player_left', { id: socket.id });
    if (room.players.size === 0) rooms.delete(playerRoom);
  });
});

const PORT = process.env.PORT || 3333;
server.listen(PORT, () => console.log(`RAJA running on http://localhost:${PORT}`));
