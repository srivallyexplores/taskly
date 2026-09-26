import React, { useEffect } from 'react';

const DocumentHead = ({ 
  title, 
  description, 
  keywords,
  image,
  url,
  type = 'website'
}) => {
  const defaultTitle = 'Taskly - Task Management Made Simple';
  const defaultDescription = 'Organize your tasks, collaborate with your team, and boost productivity with Taskly.';
  const defaultImage = '/og-image.png';
  const defaultUrl = window.location.href;

  const fullTitle = title ? `${title} | Taskly` : defaultTitle;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || defaultDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description || defaultDescription;
      document.head.appendChild(meta);
    }
    
    // Update keywords if provided
    if (keywords) {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = keywords;
        document.head.appendChild(meta);
      }
    }
    
    // Update Open Graph tags
    const updateMetaProperty = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };
    
    updateMetaProperty('og:title', fullTitle);
    updateMetaProperty('og:description', description || defaultDescription);
    updateMetaProperty('og:image', image || defaultImage);
    updateMetaProperty('og:url', url || defaultUrl);
    updateMetaProperty('og:type', type);
    updateMetaProperty('og:site_name', 'Taskly');
    
    // Update Twitter Card tags
    const updateTwitterMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };
    
    updateTwitterMeta('twitter:card', 'summary_large_image');
    updateTwitterMeta('twitter:title', fullTitle);
    updateTwitterMeta('twitter:description', description || defaultDescription);
    updateTwitterMeta('twitter:image', image || defaultImage);
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url || defaultUrl);
    } else {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      canonical.setAttribute('href', url || defaultUrl);
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, image, url, type, fullTitle, defaultDescription, defaultImage, defaultUrl]);

  return null; // This component doesn't render anything
};

export default DocumentHead;