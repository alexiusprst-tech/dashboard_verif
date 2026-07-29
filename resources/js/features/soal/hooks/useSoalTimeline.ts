import { useQuery } from '@tanstack/react-query';
import { getSoalTimeline, getRevisionHistory } from '../api/soalApi';
import type { TimelineItem, RevisionHistoryItem } from '../types/timeline.types';

export function useSoalTimeline(soalId: number | null) {
    return useQuery<TimelineItem[]>({
        queryKey: ['soal-timeline', soalId],
        queryFn: () => getSoalTimeline(soalId!),
        enabled: !!soalId,
    });
}

export function useRevisionHistory(soalId: number | null) {
    return useQuery<RevisionHistoryItem[]>({
        queryKey: ['revision-history', soalId],
        queryFn: () => getRevisionHistory(soalId!),
        enabled: !!soalId,
    });
}
