import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Chat from './Chat';

interface MessageAttributes {
  id: string;
  chat_id: string;
  content: string;
  is_user: boolean;
  attachment_url?: string;
  created_at: Date;
  updated_at: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'created_at' | 'updated_at' | 'attachment_url'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public chat_id!: string;
  public content!: string;
  public is_user!: boolean;
  public attachment_url?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chat_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chats',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    is_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    attachment_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

// Thiết lập mối quan hệ
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

export default Message; 