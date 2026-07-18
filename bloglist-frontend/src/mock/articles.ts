export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  author: string;
  category: string;
  createTime: string;
  readCount: number;
}

export const articles: Article[] = [
  {
    id: 1,
    title: "React 18 新特性介绍",
    content: `# React 18 新特性介绍

React 18 带来了许多激动人心的新特性，让我们一起来看看主要的更新内容。

## 1. 自动批处理
React 18 中，所有的状态更新都将自动批处理，这意味着多个状态更新将被合并为一次重渲染，提高了应用性能。

## 2. Suspense 支持服务端渲染
新版本中，Suspense 组件可以在服务端渲染中使用，这让数据加载和代码分割变得更加灵活。

## 3. 并发特性
引入了新的并发渲染机制，使得React可以同时准备多个版本的UI。`,
    summary: "React 18 带来了许多重要更新，包括自动批处理、服务端渲染中的 Suspense 支持以及新的并发特性。",
    author: "lijiangtao",
    category: "前端开发",
    createTime: "2024-03-29",
    readCount: 128
  },
  {
    id: 2,
    title: "TypeScript 实践指南",
    content: `# TypeScript 实践指南

TypeScript 是 JavaScript 的超集，它为 JS 添加了类型系统，让开发更加稳健。

## 1. 类型注解
TypeScript 的核心特性是类型注解，它让我们可以为变量、函数参数和返回值指定类型。

## 2. 接口
接口是 TypeScript 中定义对象类型的主要方式，它可以描述对象的结构。

## 3. 泛型
泛型让我们可以编写更加灵活和可重用的代码。`,
    summary: "这篇文章介绍了 TypeScript 的核心概念和最佳实践，帮助你更好地使用 TypeScript 进行开发。",
    author: "lijiangtao",
    category: "TypeScript",
    createTime: "2024-03-28",
    readCount: 256
  },
  {
    id: 3,
    title: "NestJS 入门教程",
    content: `# NestJS 入门教程

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。

## 1. 控制器
控制器负责处理传入的请求和向客户端返回响应。

## 2. 提供者
提供者是 NestJS 中的基本概念，它们可以作为依赖注入到类中。

## 3. 模块
模块是用来组织应用程序结构的基本单位。`,
    summary: "本文介绍了 NestJS 的基础概念和核心功能，帮助你快速入门 NestJS 开发。",
    author: "lijiangtao",
    category: "后端开发",
    createTime: "2024-03-27",
    readCount: 512
  }
];

export const categories = [
  {
    id: 1,
    name: "前端开发",
    articleCount: 10
  },
  {
    id: 2,
    name: "TypeScript",
    articleCount: 5
  },
  {
    id: 3,
    name: "后端开发",
    articleCount: 8
  }
]; 