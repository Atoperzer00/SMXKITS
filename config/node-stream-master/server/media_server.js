const NodeMediaServer = require('node-media-server');
const config = require('./config/default').rtmp_server;
const User = require('./database/Schema').User;
const helpers = require('./helpers/helpers');

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (id, StreamPath, args) => {
  const streamKey = getStreamKeyFromStreamPath(StreamPath);
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);

  try {
    const user = await User.findOne({ stream_key: streamKey }).exec();
    
    if (!user) {
      console.warn(`❌ Invalid stream key: ${streamKey}`);
      const session = nms.getSession(id);
      if (session) session.reject();
    } else {
      helpers.generateStreamThumbnail(streamKey);
    }

  } catch (err) {
    console.error('❌ Error checking user stream key:', err);
    const session = nms.getSession(id);
    if (session) session.reject();
  }
});

function getStreamKeyFromStreamPath(path) {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

module.exports = nms;
