import sequelize from '../config/database';
import Chat from './Chat';
import Message from './Message';

// Đảm bảo mối quan hệ đã được thiết lập
// Mối quan hệ từ Chat đến Message
Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });

// Mối quan hệ từ Message đến Chat (không cần thiết alias chat nếu đã định nghĩa ở Message.ts)
// Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Đồng bộ hóa cơ sở dữ liệu thành công');
  } catch (error) {
    console.error('Không thể đồng bộ hóa cơ sở dữ liệu:', error);
    process.exit(1);
  }
};

export { Chat, Message }; 