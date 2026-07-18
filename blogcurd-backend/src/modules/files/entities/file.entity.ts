import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other'
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  filename: string;

  @Column()
  original_name: string;

  @Column()
  file_path: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  mime_type: string;

  @Column({ 
    type: 'enum', 
    enum: FileType, 
    default: FileType.OTHER,
    nullable: true 
  })
  file_type: FileType;

  @Column({ nullable: true })
  bucket_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
} 
 