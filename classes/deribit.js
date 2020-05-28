const WebSocket = require('ws');
const EventEmitter = require('events');

const wait = n => new Promise(r => setTimeout(r, n));

// Copied from https://github.com/askmike/deribit-v2-ws
class Deribit extends EventEmitter {
  constructor() {
    super();

    this.WSdomain = 'www.deribit.com';
    this.connected = false;
    this.reconnecting = false;
    this.afterReconnect;

    this.inflightQueue = [];
    this.subscriptions = [];

    this.id = Date.now();
  }

  nextId() {
    return ++this.id;
  }

  handleError = (e) => {
    console.log(new Date, '[DERIBIT] DERI ERROR', e);
  }

  _connect() {
    if(this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`wss://${this.WSdomain}/ws/api/v2`);
      this.ws.onmessage = this.handleWSMessage;

      this.ws.onopen = () => {
        this.connected = true;
        this.pingInterval = setInterval(this.ping, 20 * 1000);
        this.emit('statusChange', 'connected');
        resolve();
      }
      this.ws.onerror = this.handleError;

      this.ws.onclose = async e => {
        this.emit('statusChange', 'closed');
        console.log(new Date, '[DERIBIT] CLOSED CON');
        this.inflightQueue.forEach((queueElement) => {
          queueElement.connectionAborted(new Error('Deribit connection closed.'));
        });
        this.inflightQueue = [];
        this.connected = false;
        clearInterval(this.pingInterval);
        this.reconnect();
      }
    });
  }

  ping = async() => {
    const timeout = setTimeout(() => {
      console.log(new Date, '[DERIBIT] NO PING RESPONSE');
      this.terminate();
    }, 10000)
    await this.request('public/test');
    clearInterval(timeout);
  }

  terminate = async() => {
    console.log(new Date, '[DERIBIT] TERMINATED WS CON');
    this.ws.terminate();
    this.connected = false;
  }

  end = () => {
    console.log(new Date, '[DERIBIT] ENDED WS CON');
    clearInterval(this.pingInterval);
    this.ws.onclose = undefined
    this.connected = false;
    this.ws.terminate();
  }

  reconnect = async () => {
    this.reconnecting = true;

    let hook;
    this.afterReconnect = new Promise(r => hook = r);
    await wait(500);
    console.log(new Date, '[DERIBIT] RECONNECTING...');
    await this.connect();
    hook();

    this.subscriptions.forEach(sub => {
      this.subscribe(sub.type, sub.channel);
    });
  }

  connect = async () => {
    await this._connect();
  }

  findRequest(id) {
    for(let i = 0; i < this.inflightQueue.length; i++) {
      const req = this.inflightQueue[i];
      if(id === req.id) {
        this.inflightQueue.splice(i, 1);
        return req;
      }
    }
  }

  handleWSMessage = e => {
    let payload;

    try {
      payload = JSON.parse(e.data);
    } catch(e) {
      console.error('deribit send bad json', e);
    }

    if(payload.method === 'subscription') {
      return this.emit('subscription', payload.params);
    }

    if(payload.method === 'heartbeat') {
      return this.sendMessage({
        jsonrpc: '2.0',
        method: 'public/test',
        id: this.nextId(),
        params: {}
      })
    }

    const request = this.findRequest(payload.id);

    if(!request) {
      return console.error('received response to request not send:', payload);
    }

    payload.requestedAt = request.requestedAt;
    payload.receivedAt = Date.now();
    request.onDone(payload);
  }

  sendMessage = async (payload, fireAndForget) => {
    if(!this.connected) {
      if(!this.reconnecting) {
        throw new Error('Not connected.')
      }

      await this.afterReconnect;
    }

    let p;
    if(!fireAndForget) {
      let onDone;
      let connectionAborted;
      p = new Promise((r, rj) => {onDone = r; connectionAborted = rj;});

      this.inflightQueue.push({
        requestedAt: Date.now(),
        id: payload.id,
        onDone,
        connectionAborted
      });
    }


    this.ws.send(JSON.stringify(payload));

    return p;
  }


  request = async (path, params) => {

    if(!this.connected) {
      if(!this.reconnecting) {
        throw new Error('Not connected.');
      }

      await this.afterReconnect;
    }

    if (path.startsWith('private')) {
      throw new Error('Not authenticated.');
    }

    const message = {
      jsonrpc: '2.0',
      method: path,
      params,
      id: this.nextId()
    }

    return this.sendMessage(message);
  }

  subscribe = (type, channel) => {

    this.subscriptions.push({type, channel});

    if(!this.connected) {
      throw new Error('Not connected.');
    } else if(type === 'private') {
      throw new Error('Not authenticated.');
    }

    const message = {
      jsonrpc: '2.0',
      method: `${type}/subscribe`,
      params: {
        channels: [ channel ]
      },
      id: this.nextId()
    }

    return this.sendMessage(message);
  }
}

module.exports = Deribit;
