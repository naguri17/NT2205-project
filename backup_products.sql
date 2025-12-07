--
-- PostgreSQL database dump
--

\restrict CSVRCJdqPOsgAs4bBcrRx4GomMOQC9CJyxxkua7vA7hBQOfAErq4WKqWX95Hg6b

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_categorySlug_fkey";
DROP INDEX IF EXISTS public."Category_slug_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."Category" DROP CONSTRAINT IF EXISTS "Category_pkey";
ALTER TABLE IF EXISTS public."Product" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Category" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP SEQUENCE IF EXISTS public."Product_id_seq";
DROP TABLE IF EXISTS public."Product";
DROP SEQUENCE IF EXISTS public."Category_id_seq";
DROP TABLE IF EXISTS public."Category";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: admin
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Category" (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


ALTER TABLE public."Category" OWNER TO admin;

--
-- Name: Category_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Category_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Category_id_seq" OWNER TO admin;

--
-- Name: Category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Category_id_seq" OWNED BY public."Category".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    "shortDescription" text NOT NULL,
    description text NOT NULL,
    price integer NOT NULL,
    sizes text[],
    colors text[],
    images jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "categorySlug" text NOT NULL
);


ALTER TABLE public."Product" OWNER TO admin;

--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Product_id_seq" OWNER TO admin;

--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO admin;

--
-- Name: Category id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Category" ALTER COLUMN id SET DEFAULT nextval('public."Category_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Category" (id, name, slug) FROM stdin;
1	T-shirts	T-shirts
2	shoes	shoes
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Product" (id, name, "shortDescription", description, price, sizes, colors, images, "createdAt", "updatedAt", "categorySlug") FROM stdin;
1	Adidas CoreFit T-Shirt	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	39	{s,m,l,xl,xxl}	{gray,purple,green}	{"gray": "/products/1g.png", "green": "/products/1gr.png", "purple": "/products/1p.png"}	2025-12-07 06:24:58.283	2025-12-07 06:24:58.283	T-shirts
2	Puma Ultra Warm Zip	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	59	{s,m,l,xl}	{gray,green}	{"gray": "/products/2g.png", "green": "/products/2gr.png"}	2025-12-07 06:25:43.614	2025-12-07 06:25:43.614	T-shirts
4	Nike Dri Flex T-Shirt	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	29	{s,m,l}	{white,pink}	{"pink": "/products/4p.png", "white": "/products/4w.png"}	2025-12-07 06:26:41.179	2025-12-07 06:26:41.179	T-shirts
5	Under Armour StormFleece	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	49	{s,m,l}	{red,orange,black}	{"red": "/products/5r.png", "black": "/products/5bl.png", "orange": "/products/5o.png"}	2025-12-07 06:27:20.86	2025-12-07 06:27:20.86	T-shirts
8	Levi’s Classic Denim	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	59	{s,m,l}	{blue,green}	{"blue": "/products/8b.png", "green": "/products/8gr.png"}	2025-12-07 06:28:42.589	2025-12-07 06:28:42.589	T-shirts
6	Nike Air Max 270	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	59	{40,42,43,44}	{gray,white}	{"gray": "/products/6g.png", "white": "/products/6w.png"}	2025-12-07 06:27:46.96	2025-12-07 06:27:46.96	shoes
9	Levi’s Classic Denim	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	59	{s,m,l}	{blue,green}	{"blue": "/products/8b.png", "green": "/products/8gr.png"}	2025-12-07 06:32:28.321	2025-12-07 06:32:28.321	T-shirts
3	Nike Air Essentials Pullover	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	69	{s,m,l}	{green,blue,black}	{"blue": "/products/3b.png", "black": "/products/3bl.png", "green": "/products/3gr.png"}	2025-12-07 06:26:12.665	2025-12-07 06:26:12.665	T-shirts
7	Nike Ultraboost Pulse 	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit. Lorem ipsum dolor sit amet consect adipisicing elit lorem ipsum dolor sit.	69	{40,42,43}	{gray,pink}	{"gray": "/products/7g.png", "pink": "/products/7p.png"}	2025-12-07 06:28:12.623	2025-12-07 06:28:12.623	shoes
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
59d72b51-a73c-43ef-bd1c-47a7309f51a1	54189f662526f56efb4983d1b986b5bbdd07625174440e93a5942c0e11098130	2025-12-05 09:09:30.069553+00	20251205090930_create_product_and_category	\N	\N	2025-12-05 09:09:30.042811+00	1
\.


--
-- Name: Category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Category_id_seq"', 3, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public."Product_id_seq"', 16, true);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Product Product_categorySlug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES public."Category"(slug) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict CSVRCJdqPOsgAs4bBcrRx4GomMOQC9CJyxxkua7vA7hBQOfAErq4WKqWX95Hg6b

