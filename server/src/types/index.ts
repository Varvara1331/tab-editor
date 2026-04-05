/**
 * @fileoverview TypeScript типы и интерфейсы для всего приложения.
 * Содержит определения типов данных, интерфейсы сущностей и вспомогательные типы.
 * 
 * @module types
 */

import { Request } from 'express';

export interface IUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
  settings?: Record<string, any> | null;
}

export interface ITab {
  id: number;
  userId: number;
  title: string;
  artist?: string;
  tuning: string[];
  measures: any[];
  notesPerMeasure?: number;
  isPublic: boolean;
  views: number;
  likes: number;
  preview?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibraryItem {
  id: number;
  userId: number;
  tabId: number;
  tabData: string;
  isPublication: boolean;
  originalAuthorId: number;
  originalAuthorName: string;
  addedAt: Date;
  lastOpened?: Date;
}

export interface IFavoriteTab {
  id: number;
  userId: number;
  title: string;
  artist?: string;
  tuning: string[];
  measures: any[];
  notesPerMeasure?: number;
  isPublic: boolean;
  preview?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  addedAt: string;
}

export interface ITheoryProgress {
  userId: number;
  completedArticles: string[];
  lastRead: string | null;
  quizScores: Record<string, number>;
  totalPoints: number;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface JwtPayload {
  id: number;
  iat: number;
  exp: number;
}

export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return { success: true, data, message };
  }
  
  static error(error: string) {
    return { success: false, error };
  }
}

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;