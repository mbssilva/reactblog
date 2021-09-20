import React, { useEffect, useState } from 'react'

import Header from '../components/Header'

import Link from 'next/link'
import { GetStaticProps } from 'next';

import { FiCalendar, FiUser } from 'react-icons/fi'
import { format, parseISO } from 'date-fns'


import Prismic from "@prismicio/client"
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
    slug?: string;
    first_publication_date: string | null;
    data: {
        title: string;
        subtitle: string;
        author: string;
    };
}

interface PostPagination {
    next_page: string;
    results: Post[];
}

interface HomeProps {
    postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

    const [posts, setPosts] = useState(postsPagination.results)
    const [nextPage, setNextPage] = useState(postsPagination.next_page)


    async function loadMorePosts() {
        const res = await fetch(nextPage)
        const parsedRes = await res.json()
        const newNextPage = parsedRes.next_page

        const newPagination = {
            next_page: parsedRes.next_page,
            results: parsedRes.results.map(post => {
                return {
                    slug: post.uid,
                    first_publication_date: format(parseISO(post.first_publication_date), 'd MMM yyyy'),
                    data: {
                        title: post.data.title,
                        subtitle: post.data.content[0].heading,
                        author: post.data.author
                    }
                }
            })
        }

        setPosts([
            ...posts,
            ...newPagination.results
        ])

        setNextPage(newNextPage)
    }

    return (
        <>
            <div className={commonStyles.mainContent}>
                <Header />
                {
                    posts.map(post => (
                        <article key={post.slug} className={styles.postInfos}>
                            <header>
                                {
                                    <Link href={`/post/${post.slug}`}>
                                        {post.data.title}
                                    </Link>
                                }
                                <p>{post.data.subtitle}</p>
                            </header>
                            <div>
                                <span className={styles.postUpdatesAt}>
                                    <FiCalendar /> {post.first_publication_date}
                                </span>
                                <span className={styles.postAuthor}>
                                    <FiUser /> {post.data.author}
                                </span>
                            </div>
                        </article>
                    ))
                }

                {
                    nextPage !== null && (
                        <button
                            type="button"
                            onClick={loadMorePosts}
                            className={styles.loadMorePosts}
                        >
                            Carregar mais posts
                        </button>
                    )
                }
            </div>
        </>
    )

}

export const getStaticProps: GetStaticProps = async () => {

    const prismic = getPrismicClient()

    const postsResponse = await prismic.query([Prismic.Predicates.at('document.type', 'post')],
        {
            fetch: ['post.title', 'post.content', 'post.author',],
            pageSize: 2
        });
        

    const postsPagination = {
        next_page: postsResponse.next_page,
        results: postsResponse.results.map(post => {
            return {
                slug: post.uid,
                first_publication_date: format(parseISO(post.first_publication_date), 'd MMM yyyy'),
                data: {
                    title: post.data.title,
                    subtitle: post.data.content[0].heading,
                    author: post.data.author
                }
            }
        })
    }
    
    return {
        props: {
            postsPagination
        }
    }
};