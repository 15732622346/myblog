import React from 'react';
import { Link } from 'react-router-dom';

interface SimpleBlogPostProps {
  title: string;
  date: string;
  content: string;
  views?: number;
  link?: string;
}

const SimpleBlogPost: React.FC<SimpleBlogPostProps> = ({ 
  title, 
  date, 
  content,
  views = 0,
  link = "#"
}) => {
  return (
    <article className="mb-8 pb-4 border-b border-gray-200">
      <h2 className="text-xl font-bold mb-2">
        <Link to={link} className="text-gray-800 hover:text-gray-600">
          {title}
        </Link>
      </h2>
      
      <div className="text-sm text-gray-500 mb-3">
        {date} 
        {views > 0 && <span className="ml-3">阅读:{views}</span>}
      </div>
      
      <div className="prose text-gray-700 mb-3" dangerouslySetInnerHTML={{ __html: content }}></div>
      
      <div className="text-right">
        <Link to={link} className="text-blue-600 hover:underline">
          阅读全文 &gt;&gt;
        </Link>
      </div>
    </article>
  );
};

export default SimpleBlogPost; 