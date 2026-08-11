'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { LucideIcon, BookOpen, Sparkles, Swords, Target, Users } from 'lucide-react';

type LinkItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	description?: string;
};

export function LandingHeader() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	React.useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full border-b backdrop-blur-lg transition-colors',
				scrolled
					? 'border-white/10 bg-black/95'
					: 'border-transparent bg-black/70',
			)}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<div className="flex items-center gap-5">
					<Link
						href="/"
						className="flex items-center gap-2 rounded-md p-1 hover:bg-white/10"
						aria-label="AceForge home"
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<BookOpen className="h-4 w-4" strokeWidth={2.5} />
						</span>
						<span className="font-serif text-lg font-semibold text-white">AceForge</span>
					</Link>
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent">Product</NavigationMenuTrigger>
								<NavigationMenuContent className="bg-[#0b0d10] p-1">
									<ul className="grid w-[34rem] grid-cols-2 gap-2 rounded-md bg-[#0b0d10] p-2">
										{productLinks.map((item, i) => (
											<li key={i}>
												<ListItem {...item} />
											</li>
										))}
									</ul>
									<div className="p-2">
										<p className="text-sm text-neutral-400">
											New to AceForge?{' '}
											<Link href="/signup" className="font-medium text-[rgb(134,196,84)] hover:underline">
												Create a free account
											</Link>
										</p>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>
							<NavigationMenuLink className="px-4" asChild>
								<Link href="/pricing" className="rounded-md p-2 text-sm font-medium text-neutral-200 hover:bg-white/10 hover:text-white">
									Pricing
								</Link>
							</NavigationMenuLink>
						</NavigationMenuList>
					</NavigationMenu>
				</div>
				<div className="hidden items-center gap-2 md:flex">
					<Button
						asChild
						variant="outline"
						className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
					>
						<Link href="/login">Sign In</Link>
					</Button>
					<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
						<Link href="/signup">Get Started</Link>
					</Button>
				</div>
				<Button
					size="icon"
					variant="outline"
					onClick={() => setOpen(!open)}
					className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden"
					aria-expanded={open}
					aria-controls="mobile-menu"
					aria-label="Toggle menu"
				>
					<MenuToggleIcon open={open} className="size-5" duration={300} />
				</Button>
			</nav>
			<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
				<NavigationMenu className="max-w-full">
					<div className="flex w-full flex-col gap-y-2">
						<span className="text-sm text-neutral-400">Product</span>
						{productLinks.map((link) => (
							<ListItem key={link.title} {...link} onClick={() => setOpen(false)} />
						))}
						<Link
							href="/pricing"
							onClick={() => setOpen(false)}
							className="rounded-sm p-2 text-sm font-medium text-neutral-200 hover:bg-white/10 hover:text-white"
						>
							Pricing
						</Link>
					</div>
				</NavigationMenu>
				<div className="flex flex-col gap-2">
					<Button
						asChild
						variant="outline"
						className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
					>
						<Link href="/login" onClick={() => setOpen(false)}>Sign In</Link>
					</Button>
					<Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
						<Link href="/signup" onClick={() => setOpen(false)}>Get Started</Link>
					</Button>
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-black/95 backdrop-blur-lg',
				'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y border-white/10 md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
					'size-full p-4',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: Icon,
	className,
	href,
	...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
	return (
		<NavigationMenuLink
			className={cn(
				'flex w-full flex-row gap-x-2 rounded-sm p-2 text-white hover:bg-white/10 focus:bg-white/10',
				className,
			)}
			{...props}
			asChild
		>
			<Link href={href}>
				<div className="flex aspect-square size-12 items-center justify-center rounded-md border border-white/10 bg-white/5 shadow-sm">
					<Icon className="size-5 text-[rgb(134,196,84)]" />
				</div>
				<div className="flex flex-col items-start justify-center">
					<span className="font-medium text-white">{title}</span>
					<span className="text-xs text-neutral-400">{description}</span>
				</div>
			</Link>
		</NavigationMenuLink>
	);
}

const productLinks: LinkItem[] = [
	{
		title: 'AI Generation',
		href: '/generate',
		description: 'Instant questions & worksheets from any topic',
		icon: Sparkles,
	},
	{
		title: 'Arena — Live Quizzes',
		href: '/arena',
		description: 'Host & join live multiplayer quiz games',
		icon: Swords,
	},
	{
		title: 'SAT Prep',
		href: '/sat',
		description: 'Adaptive practice for a higher SAT score',
		icon: Target,
	},
	{
		title: 'Tutoring',
		href: '/tutoring',
		description: 'Book real human tutors for 1-on-1 help',
		icon: Users,
	},
];

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	// also check on first load
	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}
