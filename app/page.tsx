"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface Post {
  id: number;
  post: string;
  created_at: string;
}

export default function Home() {
  const [data, setData] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: content, error } = await supabase
        .from("linkedin_raw_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setData(content);
      }
    }

    fetchData();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleInsert() {
    const { error } = await supabase
      .from("linkedin_raw_content")
      .insert({ post: newPost });

    if (error) {
      setError(error.message);
    } else {
      setNewPost("");
      const { data: content } = await supabase
        .from("linkedin_raw_content")
        .select("*")
        .order("created_at", { ascending: false });
      setData(content);
    }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase
      .from("linkedin_raw_content")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      const { data: content } = await supabase
        .from("linkedin_raw_content")
        .select("*")
        .order("created_at", { ascending: false });
      setData(content);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">LinkedIn Raw Content</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        ) : (
          <Button onClick={() => router.push("/login")}>Login</Button>
        )}
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <Textarea
            rows={3}
            placeholder="Enter post content..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleInsert}>Add Post</Button>
        </CardFooter>
      </Card>

      {error && <p className="text-destructive mb-4">Error: {error}</p>}

      {!data && !error && <p>Loading...</p>}

      {data && data.length === 0 && (
        <p className="text-muted-foreground">No posts yet</p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <p className="mb-2">{item.post}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{new Date(item.created_at).toLocaleString()}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
