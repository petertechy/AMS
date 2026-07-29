import { addMaintenanceCommentAction } from "@/app/actions/maintenance";
import SubmitButton from "@/components/SubmitButton";
import type { MaintenanceCommentRow } from "@/lib/models";

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentThread({
  comment,
  replies,
  requestId,
  returnTo,
  canReply,
}: {
  comment: MaintenanceCommentRow;
  replies: MaintenanceCommentRow[];
  requestId: number;
  returnTo: string;
  canReply: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-md p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-900">{comment.author_name}</span>
        <span className="text-xs text-slate-400">{formatDateTime(comment.created_at)}</span>
      </div>
      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{comment.body}</p>

      {replies.length > 0 && (
        <div className="mt-3 ml-4 pl-3 border-l-2 border-slate-100 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{reply.author_name}</span>
                <span className="text-xs text-slate-400">{formatDateTime(reply.created_at)}</span>
              </div>
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {canReply && (
        <details className="mt-2">
          <summary className="text-xs text-indigo-600 cursor-pointer select-none">Reply</summary>
          <form action={addMaintenanceCommentAction} className="mt-2 flex gap-2">
            <input type="hidden" name="requestId" value={requestId} />
            <input type="hidden" name="parentId" value={comment.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input
              name="body"
              required
              placeholder="Write a reply…"
              className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
            />
            <SubmitButton pendingLabel="…" className="bg-slate-900 text-white rounded-md px-3 py-1.5 text-xs font-medium hover:bg-slate-800">
              Reply
            </SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}

export default function MaintenanceDiscussion({
  requestId,
  comments,
  returnTo,
  canReply,
}: {
  requestId: number;
  comments: MaintenanceCommentRow[];
  returnTo: string;
  canReply: boolean;
}) {
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<number, MaintenanceCommentRow[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h2 className="text-sm font-semibold text-slate-900 mb-1">Discussions</h2>
      <p className="text-xs text-slate-500 mb-4">
        Internal conversation for this record. Replies are nested under their parent messages.
      </p>

      <div className="space-y-3 mb-4">
        {topLevel.map((c) => (
          <CommentThread
            key={c.id}
            comment={c}
            replies={repliesByParent.get(c.id) ?? []}
            requestId={requestId}
            returnTo={returnTo}
            canReply={canReply}
          />
        ))}
        {topLevel.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
      </div>

      {canReply && (
        <form action={addMaintenanceCommentAction} className="space-y-2">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Add an internal comment…"
            className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <SubmitButton pendingLabel="Posting…" className="bg-indigo-600 text-white rounded-md px-4 py-1.5 text-sm font-medium hover:bg-indigo-700">
            Post Comment
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
