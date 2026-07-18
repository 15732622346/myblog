import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Login from '../pages/login';
import Dashboard from '../pages/dashboard';
import PostList from '../pages/posts/PostList';
import PostEdit from '../pages/posts/PostEdit';
import CategoryList from '../pages/categories';
import Profile from '../pages/profile';
import ResumeEdit from '../pages/resume/ResumeEdit';
import AdvertisementEdit from '../pages/advertisement/AdvertisementEdit';
import ResourceManager from '../pages/resources/ResourceManager';
import PrivateRoute from '../components/PrivateRoute';
import WorksEdit from '../pages/works/WorksEdit';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/admin',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'posts',
        element: <PostList />,
      },
      {
        path: 'posts/create',
        element: <PostEdit />,
      },
      {
        path: 'posts/edit/:id',
        element: <PostEdit />,
      },
      {
        path: 'categories',
        element: <CategoryList />,
      },
      {
        path: 'files',
        element: <ResourceManager />,
      },
      {
        path: 'resume',
        element: <ResumeEdit />,
      },
      {
        path: 'advertisement',
        element: <AdvertisementEdit />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'works',
        element: <WorksEdit />,
      },
    ],
  },
]);