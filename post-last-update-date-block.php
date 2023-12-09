<?php
/**
 * Plugin Name:       Post Last Update Date Block
 * Description:       Adds the Last Update Date block to Gutenberg to be used in the Site Editor.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Nicola Mustone
 * Author URI:        https://nicolamustone.blog
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       post-last-update-date-block
 *
 * @package           nicolamustone
 */	

/*
Post Last Update Date Block is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
any later version.

Post Last Update Date Block is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Post Last Update Date Block. If not, see https://www.gnu.org/licenses/gpl-2.0.html.
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/reference/functions/register_block_type/
 */
function post_last_update_date_block_post_init() {
	register_block_type( __DIR__ . '/build', array(
		'render_callback' => 'post_last_update_date_block_post_render',
	) );
}
add_action( 'init', 'post_last_update_date_block_post_init' );

/**
* Renders the `nicolamustone/post-last-update-date` block on the server.
*
* @param array    $attributes Block attributes.
* @param string   $content    Block default content.
* @param WP_Block $block      Block instance.
* @return string  Returns the filtered post date for the current post wrapped inside "time" tags.
*/
function post_last_update_date_block_post_render( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}
	
	$post_ID          = $block->context['postId'];
	
	if ( get_the_modified_date( 'Ymdhi', $post_ID ) > get_the_date( 'Ymdhi', $post_ID ) ) {
		return '';
	}
	
	$formatted_date   = get_the_modified_date( empty( $attributes['format'] ) ? '' : $attributes['format'], $post_ID );
	$unformatted_date = esc_attr( get_the_date( 'c', $post_ID ) );
	$content          = empty( $attributes['content'] ) ?  __( 'Updated', 'updated-time-block' ) : $attributes['content'];
	$classes          = array( 'wp-block-post-date', 'wp-block-post-date__modified-date' );
	
	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}
	
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );
	
	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] ) {
		$formatted_date = sprintf( '<a href="%1s">%2s</a>', get_the_permalink( $post_ID ), $formatted_date );
	}
	
	
	return sprintf(
		'<div %1$s><time datetime="%2$s">%3$s</time></div>',
		$wrapper_attributes,
		$unformatted_date,
		esc_html( $content . '&nbsp;' . $formatted_date )
	);
}