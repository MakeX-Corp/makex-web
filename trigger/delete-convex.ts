import { task } from "@trigger.dev/sdk/v3";
import { deleteConvexProject } from "@/utils/server/convex";
export const deleteConvex = task({
  id: "delete-convex",
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: { projectId: string }) => {
    const { projectId } = payload;
    await deleteConvexProject({
      projectId: projectId,
    });
  },
});
