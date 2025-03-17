import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import Message from './Message';

interface ChatAttributes {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  messages?: Message[];
}

interface ChatCreationAttributes extends Optional<ChatAttributes, 'id' | 'created_at' | 'updated_at' | 'messages'> { }

class Chat extends Model<ChatAttributes, ChatCreationAttributes> implements ChatAttributes {
  public id!: string;
  public title!: string;
  public created_at!: Date;
  public updated_at!: Date;
  public messages?: Message[];
}

Chat.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
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
    tableName: 'chats',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Chat; 