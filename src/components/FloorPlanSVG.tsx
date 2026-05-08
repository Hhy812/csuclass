import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { ClassroomStatus } from '@/lib/classroom-status';

interface FloorPlanSVGProps {
  building: string;
  floor: number;
  statuses: Record<string, ClassroomStatus>;
}

interface StatusColor {
  fill: string;
  stroke: string;
  text: string;
}

const FALLBACK_ASPECT_RATIO = '16 / 9';
const ROOM_ID_PATTERN = /^(?:[ABCD]\d{3}(?:-\d+)?|科教北\d{3}(?:-\d+)?|科教南\d{3}(?:-\d+)?)$/;
const SVG_CACHE = new Map<string, { svgText: string; aspectRatio: string }>();
const BASE_URL = import.meta.env.BASE_URL || '/';

const STATUS_COLORS: Record<ClassroomStatus, StatusColor> = {
  free: {
    fill: '#10b981',
    stroke: '#047857',
    text: '#ffffff',
  },
  occupied: {
    fill: '#f43f5e',
    stroke: '#be123c',
    text: '#ffffff',
  },
  unknown: {
    fill: '#cbd5e1',
    stroke: '#64748b',
    text: '#1e293b',
  },
};

function resolveFloorSvgFile(building: string, floor: number): string | null {
  const floorNumber = Math.trunc(floor);
  if (floorNumber < 1) return null;

  if (building === 'A' || building === 'B' || building === 'C' || building === 'D') {
    return `${building}${floorNumber}.svg`;
  }
  if (building === '科教北' || building === '科北') {
    return `科北${floorNumber}.svg`;
  }
  if (building === '科教南' || building === '科南') {
    return `科南${floorNumber}.svg`;
  }
  return null;
}

function withBase(relativePath: string): string {
  return `${BASE_URL}${relativePath.replace(/^\/+/, '')}`;
}

function extractAspectRatio(svgEl: SVGSVGElement): string {
  const viewBox = svgEl.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[,\s]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return `${parts[2]} / ${parts[3]}`;
    }
  }

  const width = Number.parseFloat(svgEl.getAttribute('width') ?? '');
  const height = Number.parseFloat(svgEl.getAttribute('height') ?? '');
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return `${width} / ${height}`;
  }

  return FALLBACK_ASPECT_RATIO;
}

function appendClass(el: Element, className: string) {
  const classes = (el.getAttribute('class') ?? '').trim().split(/\s+/).filter(Boolean);
  if (!classes.includes(className)) {
    classes.push(className);
    el.setAttribute('class', classes.join(' '));
  }
}

function guessRoomId(labelText: string): string {
  const trimmed = labelText.trim();
  if (trimmed.startsWith('北')) return `科教北${trimmed.slice(1)}`;
  if (trimmed.startsWith('南')) return `科教南${trimmed.slice(1)}`;
  return trimmed;
}

function decorateFloorSvg(svgText: string, statuses: Record<string, ClassroomStatus>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) return svgText;

  if (doc.documentElement.tagName.toLowerCase() !== 'svg') return svgText;
  const svg = doc.documentElement as unknown as SVGSVGElement;
  const ns = svg.namespaceURI || 'http://www.w3.org/2000/svg';
  const originalWidth = Number.parseFloat(svg.getAttribute('width') ?? '');
  const originalHeight = Number.parseFloat(svg.getAttribute('height') ?? '');
  const styleTag = doc.createElementNS(ns, 'style');
  styleTag.textContent = `
    .room-shape { cursor: pointer; transition: fill .16s ease, filter .16s ease; vector-effect: non-scaling-stroke; }
    .room-shape:hover { filter: brightness(0.93); }
    .room-label { font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 20px; font-weight: 700; pointer-events: none; user-select: none; }
  `;

  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (!svg.getAttribute('viewBox')) {
    if (Number.isFinite(originalWidth) && Number.isFinite(originalHeight) && originalWidth > 0 && originalHeight > 0) {
      svg.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
    }
  }

  svg.insertBefore(styleTag, svg.firstChild);

  const roomShapes = svg.querySelectorAll('rect[id], path[id], polygon[id], circle[id], ellipse[id]');
  roomShapes.forEach((el) => {
    const roomId = el.getAttribute('id')?.trim() ?? '';
    if (!ROOM_ID_PATTERN.test(roomId)) return;

    const status = statuses[roomId] ?? 'unknown';
    const color = STATUS_COLORS[status];
    el.setAttribute('fill', color.fill);
    el.setAttribute('stroke', color.stroke);
    el.setAttribute('stroke-width', '2');
    el.setAttribute('data-room-id', roomId);
    appendClass(el, 'room-shape');
  });

  const labels = svg.querySelectorAll('text[data-generated-label="1"]');
  labels.forEach((label) => {
    const roomId = label.getAttribute('data-room-id') ?? guessRoomId(label.textContent ?? '');
    if (!ROOM_ID_PATTERN.test(roomId)) return;

    const status = statuses[roomId] ?? 'unknown';
    const color = STATUS_COLORS[status];
    label.setAttribute('fill', color.text);
    label.setAttribute('font-size', '20');
    label.setAttribute('data-room-id', roomId);
    appendClass(label, 'room-label');
  });

  return new XMLSerializer().serializeToString(svg);
}

export function FloorPlanSVG({ building, floor, statuses }: FloorPlanSVGProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgText, setSvgText] = useState('');
  const [aspectRatio, setAspectRatio] = useState(FALLBACK_ASPECT_RATIO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fileName = useMemo(() => resolveFloorSvgFile(building, floor), [building, floor]);

  useEffect(() => {
    if (!fileName) {
      setSvgText('');
      setLoadError(`暂无 ${building}座 ${floor}楼 SVG 文件`);
      setLoading(false);
      return;
    }

    let canceled = false;
    const cacheKey = fileName;
    const cached = SVG_CACHE.get(cacheKey);
    if (cached) {
      setSvgText(cached.svgText);
      setAspectRatio(cached.aspectRatio);
      setLoadError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');
    fetch(withBase(`floor-svgs/${encodeURIComponent(fileName)}`))
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then((text) => {
        if (canceled) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const parserError = doc.querySelector('parsererror');
        if (parserError) throw new Error('SVG 解析失败');

        if (doc.documentElement.tagName.toLowerCase() !== 'svg') {
          throw new Error('不是有效的 SVG 根节点');
        }
        const svg = doc.documentElement as unknown as SVGSVGElement;
        const ratio = extractAspectRatio(svg);
        SVG_CACHE.set(cacheKey, { svgText: text, aspectRatio: ratio });
        setSvgText(text);
        setAspectRatio(ratio);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (canceled) return;
        setSvgText('');
        setAspectRatio(FALLBACK_ASPECT_RATIO);
        setLoadError(`加载平面图失败: ${String(err)}`);
        setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [building, floor, fileName]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const roomElement = target.closest('[data-room-id]');
      const roomId = roomElement?.getAttribute('data-room-id');
      if (!roomId) return;

      const status = statuses[roomId] ?? 'unknown';
      if (status === 'free') toast.success(`${roomId} 空闲`);
      else if (status === 'occupied') toast.error(`${roomId} 占用`);
      else toast.info(`${roomId} 状态未知`);
    };

    root.addEventListener('click', clickHandler);
    return () => {
      root.removeEventListener('click', clickHandler);
    };
  }, [statuses, svgText]);

  const renderedSvg = useMemo(() => {
    if (!svgText) return '';
    return decorateFloorSvg(svgText, statuses);
  }, [svgText, statuses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[320px] bg-slate-100/60">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (loadError || !renderedSvg) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-slate-50 px-6 text-center text-slate-500">
        {loadError || `暂无 ${building}座 ${floor}楼 平面图`}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="w-full overflow-hidden bg-white"
        style={{ aspectRatio }}
      >
        <div
          ref={containerRef}
          className="h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: renderedSvg }}
        />
      </div>
    </div>
  );
}
