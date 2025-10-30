"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface Post {
  id: number;
  post: string;
  created_at: string;
}

const suggestedProfiles = [
  {
    id: 1,
    name: "Creator 1",
    connections: "10K connections",
  },
  {
    id: 2,
    name: "Creator 1",
    connections: "10K connections",
  },
  {
    id: 3,
    name: "Creator 1",
    connections: "10K connections",
  },
];

const contentFeed = [
  {
    id: 1,
    title: "Some Cool Post Title",
    author: "First Last",
    timeAgo: "1 day ago",
    isHighlighted: true,
  },
  {
    id: 2,
    title: "Some Cool Post Title",
    author: "First Last",
    timeAgo: "1 day ago",
    isHighlighted: false,
  },
  {
    id: 3,
    title: "Some Cool Post Title",
    author: "First Last",
    timeAgo: "1 day ago",
    isHighlighted: false,
  },
];

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
        <h1 className="text-2xl">Muse</h1>
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

      <section className="flex w-[378px] flex-col items-start gap-4 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-6">
        <p className="text-base font-semibold leading-none text-[#696969]">
          SUGGESTED PROFILES • <span className="font-normal">30 following</span>
        </p>
        <div className="flex w-full flex-col space-y-[10px]">
          {suggestedProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex w-full items-start gap-2.5 rounded-xl bg-[#F6F7F6] px-5 py-4"
            >
              <div className="h-12 w-12 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  fill="none"
                  className="h-full w-full"
                >
                  <path
                    d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z"
                    fill="#D9D9D9"
                  />
                  <path
                    d="M24 24C26.7614 24 29 21.7614 29 19C29 16.2386 26.7614 14 24 14C21.2386 14 19 16.2386 19 19C19 21.7614 21.2386 24 24 24Z"
                    fill="#F6F7F6"
                  />
                  <path
                    d="M24 27C19.5817 27 16 30.5817 16 35H32C32 30.5817 28.4183 27 24 27Z"
                    fill="#F6F7F6"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-[#696969]">
                  {profile.name}
                </span>
                <span className="text-sm font-normal text-[#696969]">
                  {profile.connections}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 flex w-[378px] flex-col items-start gap-4 rounded-2xl border border-[#E1E1E1] bg-[#FFFEFE] p-6">
        <p className="text-base font-semibold leading-none text-[#696969]">
          CONTENT FEED • <span className="font-normal">30 posts</span>
        </p>
        <div className="flex w-full items-start justify-between rounded-xl border border-[#E1E1E1] px-3 py-3 text-sm text-[#696969]">
          <span>Search for a post...</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="none"
            className="h-4 w-4"
          >
            <path
              d="M9.167 15a5.833 5.833 0 1 0 0-11.667A5.833 5.833 0 0 0 9.167 15Zm5.1-.1L17.5 18.333"
              stroke="#696969"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex w-full flex-col space-y-[10px]">
          {contentFeed.map((post) => (
            <div
              key={post.id}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-xl px-5 py-4",
                post.isHighlighted
                  ? "border border-[#5578C8] bg-[#E9F0FF]"
                  : "border border-[#E1E1E1] bg-white"
              )}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
                <Image
                  src="/Linkedin_icon.png"
                  alt="LinkedIn"
                  width={48}
                  height={48}
                />
              </div>
              <div className="flex flex-col text-[#696969]">
                <span className="text-base font-semibold leading-tight">
                  {post.title}
                </span>
                <span className="text-sm font-normal">
                  {post.author} • {post.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

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
