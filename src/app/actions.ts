"use server";

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLike(postId: string) {
  const supabase = await createClient();

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User must be logged in to like posts.");
  }

  // 2. Check if the like already exists
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // 3A. If liked, delete it (Unlike)
    await supabase.from("likes").delete().eq("id", existingLike.id);
  } else {
    // 3B. If not liked, insert it (Like)
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
  }

  // 4. Refresh the page data so the count stays accurate on reload
  revalidatePath(`/post/${postId}`);
}