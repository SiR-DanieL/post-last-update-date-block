/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress Dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	RichText,
	__experimentalDateFormatPicker as DateFormatPicker,
	__experimentalPublishDateTimePicker as PublishDateTimePicker,
} from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	ToggleControl,
	PanelBody,
} from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { DOWN } from '@wordpress/keycodes';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit( {
	attributes: { textAlign, format, isLink, content },
	context: { postId, postType: postTypeSlug, queryId },
	setAttributes,
} ) {
	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-post-date', {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	//Use internal state instead of a ref to make sure that the component
	//re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	//Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( { anchor: popoverAnchor } ),
		popoverAnchor
	);

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const dateSettings = getDateSettings();
	const [ siteFormat = dateSettings.formats.date ] = useEntityProp(
		'root',
		'site',
		'date_format'
	);
	const [ siteTimeFormat = dateSettings.formats.time ] = useEntityProp(
		'root',
		'site',
		'time_format'
	);
	const [ date, setDate ] = useEntityProp(
		'postType',
		postTypeSlug,
		'date',
		postId
	);

	let postDate = date ? (
		<time dateTime={ dateI18n( 'c', date ) } ref={ setPopoverAnchor }>
			{ dateI18n( format || siteFormat, date ) }
		</time>
	) : (
		__( 'Post Update Date' )
	);

	if ( isLink && date ) {
		postDate = (
			<a
				href="#post-date-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
			>
				{ postDate }
			</a>
		);
	}

	function onChange( attribute ) {
		return ( newValue ) => {
			setAttributes( { [ attribute ]: newValue } );
		};
	}

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
				{ date && ! isDescendentOfQueryLoop && (
					<ToolbarGroup>
						<Dropdown
							popoverProps={ popoverProps }
							renderContent={ ( { onClose } ) => (
								<PublishDateTimePicker
									currentDate={ date }
									onChange={ setDate }
									is12Hour={ is12HourFormat(
										siteTimeFormat
									) }
									onClose={ onClose }
								/>
							) }
							renderToggle={ ( { isOpen, onToggle } ) => {
								const openOnArrowDown = ( event ) => {
									if ( ! isOpen && event.keyCode === DOWN ) {
										event.preventDefault();
										onToggle();
									}
								};
								return (
									<ToolbarButton
										aria-expanded={ isOpen }
										icon={ edit }
										title={ __( 'Change Date' ) }
										onClick={ onToggle }
										onKeyDown={ openOnArrowDown }
									/>
								);
							} }
						/>
					</ToolbarGroup>
				) }
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<DateFormatPicker
						format={ format }
						defaultFormat={ siteFormat }
						onChange={ ( nextFormat ) =>
							setAttributes( { format: nextFormat } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Link to post' ) }
						onChange={ () => setAttributes( { isLink: ! isLink } ) }
						checked={ isLink }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<RichText
					identifier="content"
					multiline={ false }
					tagName="span"
					value={ content }
					onChange={ onChange( 'content' ) }
					aria-label={ __( 'Updated' ) }
					placeholder={ __(
						'Updated',
						'post-last-update-date-block'
					) }
					allowedFormats={ [] }
					withoutInteractiveFormatting
					data-empty={ content ? false : true }
					__unstableMobileNoFocusOnMount
				/>
				&nbsp;
				{ postDate }
			</div>
		</>
	);
}

export function is12HourFormat( format ) {
	// To know if the time format is a 12 hour time, look for any of the 12 hour
	// format characters: 'a', 'A', 'g', and 'h'. The character must be
	// unescaped, i.e. not preceded by a '\'. Coincidentally, 'aAgh' is how I
	// feel when working with regular expressions.
	// https://www.php.net/manual/en/datetime.format.php
	return /(?:^|[^\\])[aAgh]/.test( format );
}
