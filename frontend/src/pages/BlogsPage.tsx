
import { useState, useEffect } from 'react';
import NavbarTop from '@/components/NavbarTop';
import NavbarBottom from '@/components/NavbarBottom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, MessageCircle } from 'lucide-react';
import api from '@/config/api';

const BlogsPage = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get('/blogs');
        setBlogPosts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load blogs. Please try again later.');
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarTop />
      <NavbarBottom />
      
      <div className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Themabinti Blog</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the latest tips, trends, and stories in beauty, fashion, health, and lifestyle from our community of experts.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p>{error}</p>
            ) : (
              blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={post.featured_image || post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-xl font-bold line-clamp-2 hover:text-purple-600 transition-colors">
                      <a href={`/blog/${post.id}`}>{post.title}</a>
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-3">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span className="mx-1">•</span>
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime || '5 min read'}</span>
                      <span className="mx-1">•</span>
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments || 0}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.authorImage} alt={post.author} />
                        <AvatarFallback>{post.author.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{post.author}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                      <a href={`/blog/${post.id}`}>Read More</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
          
          <div className="text-center mt-12">
            <Button className="bg-purple-500 hover:bg-purple-600">Load More Articles</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;
