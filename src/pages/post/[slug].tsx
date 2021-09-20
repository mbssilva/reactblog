import React from 'react';

import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head'
import { useRouter } from 'next/router'

import { format, parseISO } from 'date-fns'
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Prismic from "@prismicio/client"
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import Header from '../../components/Header';

interface Post {
    slug: string
    first_publication_date: string | null;
    data: {
        title: string;
        banner: {
            url: string;
        };
        author: string;
        content: {
            heading: string
            body: {
                text: string;
            }[];
        }[];
    };
}

interface PostProps {
    post: Post;
}

export default function Post({ post }: PostProps) {

    const router = useRouter()

    if( router.isFallback ) {
        return <div>Carregando...</div>
    }

    const expandTime = post.data.content.reduce(( acc, content ) => {
        const wordsLength = RichText.asText(content.body).split( ' ' ).length
        return Math.ceil( acc + wordsLength / 200 )
    }, 0)

    return (
        <>
            <Head>
                <title>{post.data.title} | My Tech Blog</title>
            </Head>

            <div className={commonStyles.mainContent}>
                <Header />
            </div>

            <figure className={styles.postBanner}>
                <img src={post.data.banner.url} alt={post.data.title} />
            </figure>

            <div className={commonStyles.mainContent}>
                <header className={styles.postInfos}>
                    <h2>{post.data.title}</h2>
                    <div>
                        <span className={styles.postUpdatesAt}>
                            <FiCalendar /> {post.first_publication_date}
                        </span>
                        <span className={styles.postAuthor}>
                            <FiUser /> {post.data.author}
                        </span>
                        <span className={styles.postExpentTime}>
                            <FiClock />
                            {expandTime} min
                        </span>
                    </div>
                </header>

                <section className={ styles.postContent }>
                    {
                        post.data.content.map((item, index) => (
                            <div key={index}>
                                <h3>{item.heading}</h3>
                                <article dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }} />
                            </div>
                        ))
                    }
                </section>
            </div>
        </>
    )

}

export const getStaticPaths: GetStaticPaths = async () => {
    const prismic = getPrismicClient();
    const posts = await prismic.query([Prismic.Predicates.at('document.type', 'post')],
    {
        fetch: ['post.title', 'post.subtitle', 'post.author']
    })

    const slugs = posts.results.map( slug => slug.uid )


    // TODO
    return {
        paths: slugs.map( slug => {
            return { params: { slug } }
        }),
        fallback: true
    }
};

export const getStaticProps: GetStaticProps = async context => {
    const { params } = context
    const prismic = getPrismicClient();
    const response = await prismic.getByUID('post', String(params.slug), {})

    // console.log('response', response)

    const post = {
        slug: params.slug,
        first_publication_date: format(parseISO(response.first_publication_date), 'd MMM yyyy'),
        data: {
            title: response.data.title,
            banner: {
                url: response.data.banner.url,
            },
            author: response.data.author,
            content: response.data.content
        }
    }

    // TODO
    return {
        props: { post },
        redirect: 60 * 30, // 30 minutes
    }
}
