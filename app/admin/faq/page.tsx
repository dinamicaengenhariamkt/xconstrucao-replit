'use client';

import { useState, useMemo } from 'react';
import { cn } from '@shared/lib/utils';
import { FAQEmptyState } from '@features/shared/faq/FAQEmptyState';
import { FAQHeroSearch } from '@features/shared/faq/FAQHeroSearch';
import { FAQCategoryCard } from '@features/shared/faq/FAQCategoryCard';
import { FAQSectionHeader } from '@features/shared/faq/FAQSectionHeader';
import { useAdminFAQ, useDeletarFaq } from '@features/admin/faq/hooks/use-faq';
import {
  ADMIN_FAQ_CATEGORIES,
  ADMIN_FAQ_CATEGORY_META,
  ADMIN_FAQ_VISAO_LABELS,
  ADMIN_FAQ_VISAO_COLORS,
} from '@features/admin/faq/constants';
import { NovaPerguntaModal } from '@features/admin/faq/components/NovaPerguntaModal';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  RiArrowDownSLine,
  RiAddLine,
  RiCalendarLine,
  RiGroupLine,
  RiUserLine,
  RiToolsLine,
  RiWalletLine,
  RiBuildingLine,
  RiSettings3Line,
  RiEditLine,
  RiDeleteBinLine,
} from 'react-icons/ri';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { useToast } from '@shared/hooks/use-toast';
import type { AdminFAQItem, FAQVisao } from '@features/admin/faq/types';
import type { IconType } from 'react-icons';

type FAQAtivoStatus = 'ativo' | 'inativo';

const CATEGORY_OPTIONS: { value: string; label: string }[] = Object.entries(
  ADMIN_FAQ_CATEGORIES,
).map(([value, label]) => ({ value, label }));

const VISAO_OPTIONS: { value: FAQVisao; label: string }[] = (
  Object.keys(ADMIN_FAQ_VISAO_LABELS) as FAQVisao[]
).map((v) => ({ value: v, label: ADMIN_FAQ_VISAO_LABELS[v] }));

const STATUS_OPTIONS: { value: FAQAtivoStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

const CATEGORY_ICONS: Record<string, IconType> = {
  usuarios: RiGroupLine,
  clientes: RiUserLine,
  empreiteiras: RiToolsLine,
  financeiro: RiWalletLine,
  obras: RiBuildingLine,
  configuracoes: RiSettings3Line,
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function FAQPageSkeleton() {
  return (
    <div className="p-10 flex flex-col gap-10 animate-pulse">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="max-w-3xl mx-auto w-full space-y-4 text-center">
        <Skeleton className="h-14 w-3/4 mx-auto rounded-xl" />
        <Skeleton className="h-5 w-2/3 mx-auto rounded" />
        <Skeleton className="h-12 w-full max-w-2xl mx-auto rounded-2xl" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-64 rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminFAQAccordion({
  item,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: AdminFAQItem;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
      data-testid={`faq-item-${item.id}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        data-testid={`faq-toggle-${item.id}`}
      >
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
            {item.question}
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className={cn(
                'no-default-hover-elevate no-default-active-elevate rounded-full text-xs',
                ADMIN_FAQ_CATEGORIES[item.category]
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              )}
              data-testid={`badge-category-${item.id}`}
            >
              {ADMIN_FAQ_CATEGORIES[item.category] || item.category}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'no-default-hover-elevate no-default-active-elevate rounded-full text-xs',
                item.ativo
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
              data-testid={`badge-ativo-${item.id}`}
            >
              {item.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                'no-default-hover-elevate no-default-active-elevate rounded-full text-xs',
                ADMIN_FAQ_VISAO_COLORS[item.visao]
              )}
              data-testid={`badge-visao-${item.id}`}
            >
              {ADMIN_FAQ_VISAO_LABELS[item.visao]}
            </Badge>
          </div>
        </div>
        <RiArrowDownSLine
          className={cn(
            'w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 mt-0.5',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.answer}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <RiCalendarLine className="w-3 h-3" />
                <span>Atualizado em {formatDate(item.atualizadoEm)}</span>
              </div>
              <span>Ordem: {item.ordem}</span>
              <span>Criado em: {formatDate(item.criadoEm)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                data-testid={`button-editar-${item.id}`}
              >
                <RiEditLine className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                data-testid={`button-excluir-${item.id}`}
              >
                <RiDeleteBinLine className="w-3.5 h-3.5 mr-1.5" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFAQPage() {
  const { data: items, isLoading } = useAdminFAQ();
  const [categorySelected, setCategorySelected] = useState<string[]>([]);
  const [visaoSelected, setVisaoSelected] = useState<FAQVisao[]>([]);
  const [statusSelected, setStatusSelected] = useState<FAQAtivoStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<AdminFAQItem | null>(null);
  const { toast } = useToast();
  const deletarFaq = useDeletarFaq();
  const [editItem, setEditItem] = useState<AdminFAQItem | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    let result = items;
    if (categorySelected.length > 0) {
      result = result.filter((i) => categorySelected.includes(i.category));
    }
    if (visaoSelected.length > 0) {
      result = result.filter((i) =>
        visaoSelected.some((v) =>
          v === 'ambos' ? i.visao === 'ambos' : i.visao === v || i.visao === 'ambos',
        ),
      );
    }
    if (statusSelected.length > 0) {
      result = result.filter((i) => statusSelected.includes(i.ativo ? 'ativo' : 'inativo'));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.question.toLowerCase().includes(query) || i.answer.toLowerCase().includes(query),
      );
    }
    return result;
  }, [items, categorySelected, visaoSelected, statusSelected, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, AdminFAQItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const advancedActiveCount =
    (categorySelected.length > 0 ? 1 : 0) +
    (visaoSelected.length > 0 ? 1 : 0) +
    (statusSelected.length > 0 ? 1 : 0);

  const clearAllAdvanced = () => {
    setCategorySelected([]);
    setVisaoSelected([]);
    setStatusSelected([]);
  };

  const showGrid =
    advancedActiveCount === 0 && !searchQuery.trim();

  const handleOpenEdit = (item: AdminFAQItem) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await deletarFaq.mutateAsync(deleteItem.id);
      toast({ title: 'Pergunta excluída' });
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDeleteItem(null);
    }
  };

  if (isLoading) {
    return <FAQPageSkeleton />;
  }

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="admin-faq-page">
      {/* Botão Nova Pergunta */}
      <div className="flex justify-end">
        <Button onClick={handleOpenNew} data-testid="button-nova-pergunta">
          <RiAddLine className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      <FAQHeroSearch
        title="Perguntas Frequentes do Administrador"
        subtitle="Respostas rápidas para a gestão de clientes, empreiteiras, financeiro e operação da plataforma."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por palavra-chave (cliente, empreiteira, financeiro...)"
      />

      {/* Filtros avançados centralizados */}
      <div className="flex flex-col items-center gap-3">
        <AdvancedFiltersPopover
          activeCount={advancedActiveCount}
          onClearAll={clearAllAdvanced}
        >
          <MultiSelectDropdown<string>
            label="Categoria"
            options={CATEGORY_OPTIONS}
            values={categorySelected}
            onChange={setCategorySelected}
            placeholder="Todas as categorias"
            testIdPrefix="filter-faq-categoria"
          />
          <MultiSelectDropdown<FAQVisao>
            label="Visão"
            options={VISAO_OPTIONS}
            values={visaoSelected}
            onChange={setVisaoSelected}
            placeholder="Todas as visões"
            testIdPrefix="filter-faq-visao"
          />
          <MultiSelectDropdown<FAQAtivoStatus>
            label="Status"
            options={STATUS_OPTIONS}
            values={statusSelected}
            onChange={setStatusSelected}
            placeholder="Todos os status"
            testIdPrefix="filter-faq-status"
          />
        </AdvancedFiltersPopover>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {categorySelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${ADMIN_FAQ_CATEGORIES[c] ?? c}`}
                onRemove={() => setCategorySelected(categorySelected.filter((x) => x !== c))}
                testId={`active-chip-faq-categoria-${c}`}
              />
            ))}
            {visaoSelected.map((v) => (
              <ActiveFilterChip
                key={v}
                label={`Visão: ${ADMIN_FAQ_VISAO_LABELS[v]}`}
                onRemove={() => setVisaoSelected(visaoSelected.filter((x) => x !== v))}
                testId={`active-chip-faq-visao-${v}`}
              />
            ))}
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${s === 'ativo' ? 'Ativo' : 'Inativo'}`}
                onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                testId={`active-chip-faq-status-${s}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Grid de categorias (visível apenas sem filtros/busca) */}
      {showGrid && items && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ADMIN_FAQ_CATEGORIES).map(([key, label]) => {
            const meta = ADMIN_FAQ_CATEGORY_META[key];
            const Icon = CATEGORY_ICONS[key] ?? RiGroupLine;
            return (
              <FAQCategoryCard
                key={key}
                categoryKey={key}
                label={label}
                description={meta?.description}
                count={items.filter((i) => i.category === key).length}
                iconBg={meta?.iconBg}
                iconColor={meta?.iconColor}
                Icon={Icon}
                onSelect={() => setCategorySelected([key])}
              />
            );
          })}
        </div>
      )}

      {/* Seções de acordeão */}
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const meta = ADMIN_FAQ_CATEGORY_META[category];
          const Icon = CATEGORY_ICONS[category] ?? RiGroupLine;
          return (
            <div key={category}>
              <FAQSectionHeader
                label={ADMIN_FAQ_CATEGORIES[category] || category}
                iconBg={meta?.iconBg}
                iconColor={meta?.iconColor}
                Icon={Icon}
              />
              <div className="space-y-3 mt-4">
                {categoryItems.map((item) => (
                  <AdminFAQAccordion
                    key={item.id}
                    item={item}
                    isOpen={openItemId === item.id}
                    onToggle={() => setOpenItemId(openItemId === item.id ? null : item.id)}
                    onEdit={() => handleOpenEdit(item)}
                    onDelete={() => setDeleteItem(item)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && <FAQEmptyState />}
      </div>

      <NovaPerguntaModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editItem={editItem}
      />

      <AlertDialog open={deleteItem !== null} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pergunta deixará de aparecer para os usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
