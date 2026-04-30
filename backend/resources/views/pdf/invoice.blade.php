<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $templateData['document_number'] ?: $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 11mm 12mm 12mm;
        }

        * {
            box-sizing: border-box;
            font-family: DejaVu Sans, sans-serif;
        }

        body {
            color: #101010;
            font-size: 10.5px;
            line-height: 1.32;
            margin: 0;
        }

        .sheet {
            min-height: 271mm;
            position: relative;
        }

        .watermark {
            color: rgba(22, 163, 74, 0.12);
            font-size: 94px;
            font-weight: 700;
            left: 19%;
            position: fixed;
            text-transform: uppercase;
            top: 42%;
            transform: rotate(-30deg);
            z-index: 0;
        }

        .content {
            position: relative;
            z-index: 1;
        }

        .title {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 0.4px;
            margin: 0 0 18px;
            text-align: center;
        }

        .top-table,
        .meta-table,
        .items-table,
        .amount-table,
        .summary-table,
        .summary-box-inner,
        .payment-table,
        .footer-table {
            border-collapse: collapse;
            width: 100%;
        }

        .top-table,
        .summary-table,
        .summary-box-inner,
        .summary-total-box table,
        .amount-table {
            table-layout: fixed;
        }

        .top-table td,
        .footer-table td {
            vertical-align: top;
        }

        .left-col {
            padding-right: 18px;
            width: 50%;
        }

        .right-col {
            padding-left: 18px;
            width: 50%;
        }

        .section-title {
            border-bottom: 3px solid #111111;
            font-size: 12.5px;
            font-weight: 700;
            margin: 0;
            padding-bottom: 6px;
        }

        .company-block {
            page-break-inside: avoid;
            padding-top: 12px;
        }

        .party-content {
            min-height: 118px;
        }

        .party-extra {
            min-height: 18px;
        }

        .company-name {
            font-size: 11.5px;
            font-weight: 700;
            margin: 0 0 8px;
        }

        .company-address {
            font-size: 10.5px;
            line-height: 1.42;
            margin: 0;
            white-space: pre-line;
        }

        .npwp {
            margin-top: 10px;
        }

        .meta-box {
            background: #d9d9d9;
            margin-left: auto;
            margin-top: 12px;
            padding: 11px 15px;
            width: 86%;
        }

        .meta-table td {
            border: 0;
            font-size: 10.5px;
            font-weight: 700;
            padding: 3px 0;
            vertical-align: top;
        }

        .meta-label {
            width: 33%;
        }

        .meta-colon {
            width: 12px;
        }

        .meta-value {
            text-align: left;
            white-space: nowrap;
        }

        .meta-value-document {
            font-size: 10px;
            letter-spacing: -0.1px;
        }

        .items-table {
            margin-top: 24px;
            page-break-inside: avoid;
        }

        .items-table th {
            background: #111111;
            border: 1px solid #111111;
            color: #ffffff;
            font-size: 10.5px;
            font-weight: 700;
            padding: 9px 12px;
            text-align: center;
        }

        .items-table td {
            border: 1px solid #111111;
            font-size: 11.5px;
            padding: 12px 14px;
            vertical-align: middle;
        }

        .item-description {
            font-weight: 700;
        }

        .amount-cell {
            padding: 0;
            width: 24%;
        }

        .amount-table td {
            border: 0;
            font-size: 11.5px;
            font-weight: 700;
            padding: 12px 14px;
            vertical-align: middle;
        }

        .currency {
            font-variant-numeric: tabular-nums;
            text-align: left;
            white-space: nowrap;
            width: 52px;
        }

        .value-right {
            font-variant-numeric: tabular-nums;
            text-align: right;
            width: 100%;
        }

        .summary-wrap {
            margin-top: 16px;
            page-break-inside: avoid;
        }

        .summary-inner {
            margin-left: auto;
            width: 344px;
        }

        .summary-table td {
            padding: 0;
            vertical-align: middle;
        }

        .summary-label {
            font-size: 11.5px;
            font-weight: 700;
            padding: 7px 12px 7px 0;
            text-align: right;
            white-space: nowrap;
            width: 136px;
        }

        .summary-box {
            border-left: 1px solid #111111;
            border-right: 1px solid #111111;
            width: 208px;
        }

        .summary-row-first .summary-box {
            border-top: 1px solid #111111;
        }

        .summary-row-middle .summary-box,
        .summary-row-last .summary-box {
            border-top: 1px dashed #111111;
        }

        .summary-row-last .summary-box {
            border-bottom: 1px solid #111111;
        }

        .summary-box-inner td {
            border: 0;
            font-size: 11.5px;
            font-weight: 700;
            padding: 7px 10px;
        }

        .summary-row-total td {
            padding-top: 10px;
        }

        .summary-total-label {
            font-size: 12.5px;
            font-weight: 800;
            padding: 0 12px 0 0;
            text-align: right;
            white-space: nowrap;
        }

        .summary-total-box {
            background: #111111;
            width: 208px;
        }

        .summary-total-box table {
            border-collapse: collapse;
            width: 100%;
        }

        .summary-total-box td {
            border: 0;
            color: #ffffff;
            font-size: 12.5px;
            font-weight: 800;
            padding: 9px 10px;
        }

        .footer-table {
            margin-top: 48px;
            page-break-inside: avoid;
        }

        .payment-column {
            width: 46%;
        }

        .payment-box {
            background: #dbe8f5;
            padding: 12px 16px 14px;
            width: 90%;
        }

        .payment-title {
            font-size: 10.5px;
            font-weight: 700;
            margin: 0 0 7px;
            text-decoration: underline;
        }

        .payment-table td {
            border: 0;
            font-size: 10.5px;
            padding: 3px 0;
            vertical-align: top;
        }

        .payment-label {
            font-weight: 700;
            width: 44%;
        }

        .payment-colon {
            width: 12px;
        }

        .signature-column {
            width: 54%;
        }

        .signature-wrap {
            padding-top: 2px;
            text-align: center;
        }

        .signature-date {
            font-size: 11.5px;
            font-weight: 700;
            margin: 0 0 66px;
        }

        .signature-name {
            font-size: 11.5px;
            font-weight: 700;
            margin: 0;
            text-decoration: underline;
        }

        .signature-role {
            font-size: 11.5px;
            font-weight: 700;
            margin: 6px 0 0;
        }

    </style>
</head>
<body>
    @if($invoice->status === \App\Models\Invoice::STATUS_PAID)
        <div class="watermark">LUNAS</div>
    @endif

    @php
        $documentNumber = $templateData['document_number'] ?: $invoice->invoice_number;
        $issueDate = \Illuminate\Support\Carbon::parse($invoice->issue_date)->format('d/m/Y');
        $signatureDate = \Illuminate\Support\Carbon::parse($templateData['signature_date'])->format('d/m/Y');
        $signatureLine = trim(($templateData['signature_city'] ?: 'Jakarta').', '.$signatureDate);
        $taxAmount = (float) round($invoice->tax_amount);
        $deductionLabel = $templateData['deduction_label'] ?: 'Potongan';
        $formatAddress = static function (?string $address, int $maxLineLength = 44): string {
            $normalized = trim((string) $address);

            if ($normalized === '') {
                return '-';
            }

            $normalized = preg_replace('/\s+/u', ' ', str_replace(["\r\n", "\r", "\n"], ' ', $normalized)) ?? '';
            $segments = preg_split('/,\s*/u', $normalized) ?: [];
            $segments = array_values(array_filter(array_map('trim', $segments), static fn (string $segment): bool => $segment !== ''));

            if ($segments === []) {
                return $normalized;
            }

            $lines = [];
            $current = '';
            $lastIndex = count($segments) - 1;

            foreach ($segments as $index => $segment) {
                $piece = $segment.($index < $lastIndex ? ',' : '');
                $candidate = $current === '' ? $piece : $current.' '.$piece;

                if ($current !== '' && mb_strlen($candidate) > $maxLineLength) {
                    $lines[] = $current;
                    $current = $piece;
                    continue;
                }

                $current = $candidate;
            }

            if ($current !== '') {
                $lines[] = $current;
            }

            return implode("\n", $lines);
        };
        $issuerAddress = $formatAddress($templateData['issuer_address']);
        $recipientAddress = $formatAddress($templateData['recipient_address']);
    @endphp

    <div class="sheet">
        <div class="content">
            <h1 class="title">INVOICE</h1>

            <table class="top-table">
                <tr>
                    <td class="left-col">
                        <p class="section-title">Informasi Perusahaan</p>
                        <div class="company-block">
                            <div class="party-content">
                                <p class="company-name">{{ $templateData['issuer_company_name'] }}</p>
                                <p class="company-address">{{ $issuerAddress }}</p>
                            </div>
                            <div class="party-extra">&nbsp;</div>
                        </div>
                    </td>
                    <td class="right-col">
                        <p class="section-title">Tagihan Kepada</p>
                        <div class="company-block">
                            <div class="party-content">
                                <p class="company-name">{{ $templateData['recipient_company_name'] }}</p>
                                <p class="company-address">{{ $recipientAddress }}</p>
                            </div>
                            <p class="company-address npwp party-extra">NPWP : {{ $templateData['recipient_npwp'] ?: '-' }}</p>
                        </div>

                        <div class="meta-box">
                            <table class="meta-table">
                                <tr>
                                    <td class="meta-label">No. Invoice</td>
                                    <td class="meta-colon">:</td>
                                    <td class="meta-value meta-value-document">{{ $documentNumber }}</td>
                                </tr>
                                <tr>
                                    <td class="meta-label">Tanggal</td>
                                    <td class="meta-colon">:</td>
                                    <td class="meta-value">{{ $issueDate }}</td>
                                </tr>
                                <tr>
                                    <td class="meta-label">No. Kontrak</td>
                                    <td class="meta-colon">:</td>
                                    <td class="meta-value">{{ $templateData['contract_number'] ?: '-' }}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>

            <table class="items-table">
                <colgroup>
                    <col style="width: 76%;">
                    <col style="width: 24%;">
                </colgroup>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($invoice->items as $item)
                        <tr>
                            <td class="item-description">{{ $item->description }}</td>
                            <td class="amount-cell">
                                <table class="amount-table">
                                    <tr>
                                        <td class="currency">Rp</td>
                                        <td class="value-right">{{ number_format((float) round($item->total), 0, ',', '.') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="summary-wrap">
                <div class="summary-inner">
                    <table class="summary-table">
                        <tr class="summary-row-first">
                            <td class="summary-label">Subtotal</td>
                            <td class="summary-box">
                                <table class="summary-box-inner">
                                    <tr>
                                        <td class="currency">Rp</td>
                                        <td class="value-right">{{ number_format((float) round($invoice->subtotal), 0, ',', '.') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="summary-row-middle">
                            <td class="summary-label">PPN</td>
                            <td class="summary-box">
                                <table class="summary-box-inner">
                                    <tr>
                                        <td class="currency">Rp</td>
                                        <td class="value-right">{{ number_format($taxAmount, 0, ',', '.') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="summary-row-last">
                            <td class="summary-label">{{ $deductionLabel }}</td>
                            <td class="summary-box">
                                <table class="summary-box-inner">
                                    <tr>
                                        <td class="currency">-Rp</td>
                                        <td class="value-right">{{ number_format((float) round($invoice->deduction_amount), 0, ',', '.') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="summary-row-total">
                            <td class="summary-total-label">Total</td>
                            <td class="summary-total-box">
                                <table>
                                    <tr>
                                        <td class="currency">Rp</td>
                                        <td class="value-right">{{ number_format((float) round($invoice->total), 0, ',', '.') }}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <table class="footer-table">
                <tr>
                    <td class="payment-column">
                        <div class="payment-box">
                            <p class="payment-title">Pembayaran :</p>
                            <table class="payment-table">
                                <tr>
                                    <td class="payment-label">Nama Bank</td>
                                    <td class="payment-colon">:</td>
                                    <td>{{ $templateData['payment_bank_name'] }}</td>
                                </tr>
                                <tr>
                                    <td class="payment-label">No. Rekening</td>
                                    <td class="payment-colon">:</td>
                                    <td>{{ $templateData['payment_account_number'] }}</td>
                                </tr>
                                <tr>
                                    <td class="payment-label">Nama Pemilik Rekening</td>
                                    <td class="payment-colon">:</td>
                                    <td>{{ $templateData['payment_account_holder'] }}</td>
                                </tr>
                            </table>
                        </div>
                    </td>
                    <td class="signature-column">
                        <div class="signature-wrap">
                            <p class="signature-date">{{ $signatureLine }}</p>
                            <p class="signature-name">({{ $templateData['signature_name'] }})</p>
                            <p class="signature-role">{{ $templateData['signature_role'] }}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
