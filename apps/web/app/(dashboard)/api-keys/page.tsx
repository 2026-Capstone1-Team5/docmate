"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Loader2,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ApiKeySummary,
  issueApiKey,
  listApiKeys,
  renameApiKey,
  revokeApiKey,
  type IssuedApiKeyResponse,
} from "@/lib/api-keys";

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [issuedKey, setIssuedKey] = useState<IssuedApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busyKeyId, setBusyKeyId] = useState<string | null>(null);

  const latestIssuedAt = useMemo(() => {
    if (apiKeys.length === 0) {
      return "발급 기록 없음";
    }

    return formatDate(
      [...apiKeys]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )[0].createdAt,
    );
  }, [apiKeys]);

  const loadApiKeys = async (options?: { silent?: boolean }) => {
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await listApiKeys();
      setApiKeys(response.items);
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("API key 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadApiKeys();
  }, []);

  const handleIssueKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = newKeyName.trim();

    if (!normalizedName) {
      setErrorMessage("API key 이름을 입력해 주세요.");
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const response = await issueApiKey(normalizedName);
      setApiKeys((current) => [response.key, ...current]);
      setIssuedKey(response);
      setCopied(false);
      setNewKeyName("");
      setEditingId(null);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("API key를 발급하지 못했습니다.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopyIssuedKey = async () => {
    if (!issuedKey?.apiKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(issuedKey.apiKey);
      setCopied(true);
    } catch {
      setErrorMessage("클립보드에 복사하지 못했습니다.");
    }
  };

  const handleStartRename = (apiKey: ApiKeySummary) => {
    setEditingId(apiKey.id);
    setEditingName(apiKey.name);
    setErrorMessage(null);
  };

  const handleSaveRename = async (apiKeyId: string) => {
    const normalizedName = editingName.trim();

    if (!normalizedName) {
      setErrorMessage("API key 이름을 입력해 주세요.");
      return;
    }

    setBusyKeyId(apiKeyId);
    setErrorMessage(null);

    try {
      const response = await renameApiKey(apiKeyId, normalizedName);
      setApiKeys((current) =>
        current.map((item) => (item.id === response.id ? response : item)),
      );
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("API key 이름을 변경하지 못했습니다.");
      }
    } finally {
      setBusyKeyId(null);
    }
  };

  const handleRevoke = async (apiKey: ApiKeySummary) => {
    if (!window.confirm(`"${apiKey.name}" API key를 삭제할까요?`)) {
      return;
    }

    setBusyKeyId(apiKey.id);
    setErrorMessage(null);

    try {
      await revokeApiKey(apiKey.id);
      setApiKeys((current) => current.filter((item) => item.id !== apiKey.id));
      if (editingId === apiKey.id) {
        setEditingId(null);
        setEditingName("");
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("API key를 삭제하지 못했습니다.");
      }
    } finally {
      setBusyKeyId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-8 pb-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge
            variant="secondary"
            className="bg-zinc-100 px-2 py-0 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          >
            MCP / Automation
          </Badge>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">API key 관리</h1>
            <p className="text-sm text-zinc-500">
              문서 endpoint를 MCP나 자동화 워크플로에서 호출할 수 있도록 API key를
              발급하고 관리합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
            <span>활성 API key {apiKeys.length}개</span>
            <span className="text-zinc-200">|</span>
            <span>마지막 발급 {latestIssuedAt}</span>
            <span className="text-zinc-200">|</span>
            <span>문서 endpoint 전용</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadApiKeys({ silent: true })}
          disabled={loading || refreshing}
          className="h-10 rounded-lg border-zinc-200 px-4 font-bold"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          새로고침
        </Button>
      </div>

      {errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-4 w-4 text-primary" />
              새 API key 발급
            </CardTitle>
            <CardDescription className="text-xs">
              발급 직후 raw key는 이 화면에서 한 번만 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 py-6">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleIssueKey}>
              <Input
                value={newKeyName}
                onChange={(event) => setNewKeyName(event.target.value)}
                placeholder="예: Claude Desktop"
                maxLength={100}
                className="h-11 rounded-xl border-zinc-200 bg-white px-4 shadow-none"
              />
              <Button
                type="submit"
                disabled={creating}
                className="h-11 rounded-xl px-5 font-bold"
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                발급
              </Button>
            </form>

            {issuedKey ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">발급 완료</p>
                    <p className="text-xs text-emerald-700">
                      <span className="font-medium">{issuedKey.key.name}</span> 키입니다.
                      이 raw key는 다시 조회되지 않으니 지금 저장해 두세요.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopyIssuedKey()}
                      className="border-emerald-200 bg-white"
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "복사됨" : "복사"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="발급된 API key 패널 닫기"
                      title="발급된 API key 패널 닫기"
                      onClick={() => {
                        setIssuedKey(null);
                        setCopied(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-emerald-100 bg-white px-4 py-3">
                  <p className="break-all font-mono text-[12px] leading-6">
                    {issuedKey.apiKey}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <CardTitle className="text-lg font-bold">MCP 연결 가이드</CardTitle>
            <CardDescription className="text-xs">
              실제 MCP 연동 가이드는 백엔드/클라이언트 사양이 정리된 뒤 제공할 예정입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 py-6">
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-5 py-6 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-zinc-200 bg-white text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                  Coming Soon
                </Badge>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  MCP 연결 가이드는 준비 중입니다.
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                현재 이 화면에서는 API key 발급과 관리만 지원합니다. MCP 클라이언트별
                설정 예시와 연결 절차는 실제 연동 사양이 확정된 뒤 별도로 안내할 예정입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <CardHeader className="border-b border-zinc-100 bg-zinc-50/30 px-8 py-5 dark:border-zinc-800 dark:bg-zinc-900/30">
          <CardTitle className="text-lg font-bold">발급된 API key</CardTitle>
          <CardDescription className="text-xs">
            목록에서는 prefix만 확인할 수 있습니다. raw key는 발급 순간에만 표시됩니다.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="font-medium text-zinc-500">API key 목록을 불러오는 중...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 hover:bg-transparent dark:border-zinc-800">
                  <TableHead className="h-10 px-8 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    이름
                  </TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Prefix
                  </TableHead>
                  <TableHead className="h-10 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    발급 시각
                  </TableHead>
                  <TableHead className="h-10 px-8 text-right text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    관리
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-56 text-center text-sm text-zinc-400">
                      <div className="flex flex-col items-center gap-3">
                        <KeyRound className="h-8 w-8 text-zinc-200" />
                        <p>아직 발급된 API key가 없습니다.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((apiKey) => {
                    const isEditing = editingId === apiKey.id;
                    const isBusy = busyKeyId === apiKey.id;

                    return (
                      <TableRow
                        key={apiKey.id}
                        className="border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
                      >
                        <TableCell className="px-8 py-4">
                          {isEditing ? (
                            <div className="flex max-w-sm items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(event) => setEditingName(event.target.value)}
                                className="h-9 rounded-xl border-zinc-200 bg-white shadow-none"
                                maxLength={100}
                              />
                              <Button
                                size="sm"
                                onClick={() => void handleSaveRename(apiKey.id)}
                                disabled={isBusy}
                              >
                                {isBusy ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                저장
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                disabled={isBusy}
                              >
                                취소
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {apiKey.name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="h-5 rounded px-1.5 font-mono text-[10px] font-bold text-zinc-500"
                          >
                            {apiKey.prefix}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-zinc-500">
                          {formatDate(apiKey.createdAt)}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          {!isEditing ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleStartRename(apiKey)}
                                disabled={isBusy}
                                className="border-zinc-200"
                              >
                                <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                                이름 변경
                              </Button>
                              <Button
                                variant="destructive"
                                size="xs"
                                onClick={() => void handleRevoke(apiKey)}
                                disabled={isBusy}
                              >
                                {isBusy ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                삭제
                              </Button>
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
