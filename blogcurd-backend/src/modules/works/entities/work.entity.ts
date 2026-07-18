import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum WorkStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ nullable: true })
  cover_url: string;

  @Column({ nullable: true })
  demo_url: string;

  @Column({ nullable: true })
  github_url: string;

  @Column({ nullable: true })
  link: string;

  @Column({ type: 'json', nullable: true })
  tech_stack: string[];

  @Column({ 
    type: 'enum', 
    enum: WorkStatus, 
    default: WorkStatus.DRAFT,
    nullable: true 
  })
  status: WorkStatus;

  @Column({ type: 'boolean', default: false, nullable: true })
  is_featured: boolean;

  @Column({ type: 'int', default: 0, nullable: true })
  view_count: number;

  @Column({ type: 'int', default: 0, nullable: true })
  like_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
export default Work; 